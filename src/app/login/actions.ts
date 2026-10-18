"use server";

import { redirect } from "next/navigation";
import { getDb } from "@/db/client";
import { signUpSchema } from "@/lib/validation";
import { findOrCreateUser, findUserById } from "@/server/users";
import { clearSessionCookie, setSessionCookie } from "@/lib/session";

export async function signInAs(formData: FormData) {
  const userId = String(formData.get("userId") ?? "");
  const next = String(formData.get("next") ?? "/");
  const db = await getDb();
  const user = await findUserById(db, userId);
  if (!user) redirect("/login?error=unknown-user");
  setSessionCookie(user.id);
  redirect(safeNext(next));
}

export type SignUpState = { error?: string; name?: string; email?: string };

/** Create a demo account, or continue as an existing one with the same email. */
export async function signUp(_prev: SignUpState, formData: FormData): Promise<SignUpState> {
  const raw = { name: String(formData.get("name") ?? ""), email: String(formData.get("email") ?? "") };
  const parsed = signUpSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the form.", ...raw };
  }
  const db = await getDb();
  const { user } = await findOrCreateUser(db, parsed.data);
  setSessionCookie(user.id);
  redirect(safeNext(String(formData.get("next") ?? "/")));
}

export async function signOut() {
  clearSessionCookie();
  redirect("/login");
}

function safeNext(next: string) {
  return next.startsWith("/") && !next.startsWith("//") ? next : "/";
}
