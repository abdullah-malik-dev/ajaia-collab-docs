"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { DocContent } from "@/db/schema";
import { api, ApiRequestError } from "@/lib/client-api";

export type SaveStatus = "saved" | "dirty" | "saving" | "error" | "conflict";

type Patch = { title?: string; content?: DocContent };
type SavedDoc = { updatedAt: string };

export const AUTOSAVE_DELAY_MS = 800;

/**
 * Debounced, serialized autosave with optimistic concurrency.
 * Only one request is in flight at a time; changes made meanwhile are saved
 * in a follow-up request so `baseUpdatedAt` always reflects the last response.
 */
export function useAutosave(docId: string, initialUpdatedAt: string) {
  const [status, setStatus] = useState<SaveStatus>("saved");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const baseRef = useRef(initialUpdatedAt);
  const pendingRef = useRef<Patch>({});
  const inflightRef = useRef(false);
  const statusRef = useRef<SaveStatus>("saved");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const update = useCallback((s: SaveStatus) => {
    statusRef.current = s;
    setStatus(s);
  }, []);

  const flush = useCallback(async () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = null;
    if (statusRef.current === "conflict") return;
    if (inflightRef.current) return; // the in-flight save re-schedules when it finishes

    const patch = pendingRef.current;
    if (patch.title === undefined && patch.content === undefined) return;
    pendingRef.current = {};
    inflightRef.current = true;
    update("saving");
    setErrorMessage(null);

    try {
      const saved = await api<SavedDoc>(`/api/documents/${docId}`, {
        method: "PATCH",
        json: { ...patch, baseUpdatedAt: baseRef.current },
      });
      baseRef.current = saved.updatedAt;
      inflightRef.current = false;
      const more = pendingRef.current;
      if (more.title !== undefined || more.content !== undefined) {
        update("dirty");
        timerRef.current = setTimeout(flush, AUTOSAVE_DELAY_MS);
      } else {
        update("saved");
      }
    } catch (e) {
      inflightRef.current = false;
      // Keep the unsaved patch; newer edits win over the failed ones.
      pendingRef.current = { ...patch, ...pendingRef.current };
      if (e instanceof ApiRequestError && e.status === 409) {
        update("conflict");
      } else {
        update("error");
        setErrorMessage(e instanceof Error ? e.message : "Couldn't save.");
      }
    }
  }, [docId, update]);

  /** Queue a change; it is saved after a short pause in typing. */
  const queue = useCallback(
    (patch: Patch) => {
      Object.assign(pendingRef.current, patch);
      if (statusRef.current !== "conflict") update("dirty");
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(flush, AUTOSAVE_DELAY_MS);
    },
    [flush, update],
  );

  /** After reloading the latest version, start clean from its timestamp. */
  const reset = useCallback(
    (updatedAt: string) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      pendingRef.current = {};
      baseRef.current = updatedAt;
      setErrorMessage(null);
      update("saved");
    },
    [update],
  );

  const hasUnsavedChanges = status === "dirty" || status === "saving" || status === "error" || status === "conflict";

  useEffect(() => {
    if (!hasUnsavedChanges) return;
    const warn = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [hasUnsavedChanges]);

  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    },
    [],
  );

  return { status, errorMessage, queue, flush, reset, hasUnsavedChanges };
}
