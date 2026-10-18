"use server";

import { redirect } from "next/navigation";
import { getDb } from "@/db/client";
import { findUserById } from "@/server/users";
import { clearSessionCookie, setSessionCookie } from "@/lib/session";

export async function signInAs(formData: FormData) {
  const userId = String(formData.get("userId") ?? "");
  const next = String(formData.get("next") ?? "/");
  const db = await getDb();
  const user = await findUserById(db, userId);
  if (!user) redirect("/login?error=unknown-user");
  setSessionCookie(user.id);
  redirect(next.startsWith("/") && !next.startsWith("//") ? next : "/");
}

export async function signOut() {
  clearSessionCookie();
  redirect("/login");
}
