import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getDb } from "@/db/client";
import { findUserById } from "@/server/users";
import type { User } from "@/db/schema";

/**
 * Mock authentication. The cookie holds the id of a seeded user, nothing more.
 * Real auth is a deliberate cut for this exercise; see ARCHITECTURE.md.
 */
export const SESSION_COOKIE = "ajaia_uid";

export function setSessionCookie(userId: string) {
  cookies().set(SESSION_COOKIE, userId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export function clearSessionCookie() {
  cookies().delete(SESSION_COOKIE);
}

/** Current user, or null when the cookie is missing or stale. */
export async function getCurrentUser(): Promise<User | null> {
  const id = cookies().get(SESSION_COOKIE)?.value;
  if (!id) return null;
  const db = await getDb();
  return findUserById(db, id);
}

/** Current user for pages; redirects to /login when signed out. */
export async function requireUser(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}
