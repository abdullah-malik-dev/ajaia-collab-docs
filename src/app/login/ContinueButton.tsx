"use client";

import { useFormStatus } from "react-dom";

export function ContinueButton({ name, email }: { name: string; email: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="group flex w-full items-center justify-between gap-4 py-4 text-left transition-colors hover:text-accent disabled:opacity-60"
    >
      <span>
        <span className="block text-lg font-medium">{name}</span>
        <span className="block text-sm text-ink-muted">{email}</span>
      </span>
      <span aria-hidden className="text-ink-faint transition-colors group-hover:text-accent">
        {pending ? "Signing in…" : "Continue"}
      </span>
    </button>
  );
}
