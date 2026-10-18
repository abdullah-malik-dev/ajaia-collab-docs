import { asc, eq } from "drizzle-orm";
import type { Db } from "@/db/client";
import { users, type User } from "@/db/schema";

export async function listUsers(db: Db): Promise<User[]> {
  return db.select().from(users).orderBy(asc(users.name));
}

export async function findUserById(db: Db, id: string): Promise<User | null> {
  if (!isUuid(id)) return null;
  const rows = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function findUserByEmail(db: Db, email: string): Promise<User | null> {
  const rows = await db
    .select()
    .from(users)
    .where(eq(users.email, email.trim().toLowerCase()))
    .limit(1);
  return rows[0] ?? null;
}

export type NewUser = { name: string; email: string };

/**
 * Lightweight sign-up: no password. If the email already exists the existing
 * user is returned, so the same form doubles as "continue with email".
 */
export async function findOrCreateUser(db: Db, input: NewUser): Promise<{ user: User; created: boolean }> {
  const email = input.email.trim().toLowerCase();
  const existing = await findUserByEmail(db, email);
  if (existing) return { user: existing, created: false };
  const [user] = await db
    .insert(users)
    .values({ id: crypto.randomUUID(), name: input.name.trim(), email })
    .onConflictDoNothing()
    .returning();
  if (user) return { user, created: true };
  // Lost a race with another sign-up for the same email.
  const raced = await findUserByEmail(db, email);
  if (!raced) throw new Error("Could not create user.");
  return { user: raced, created: false };
}

const UUID_RE =/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export function isUuid(value: string): boolean {
  return UUID_RE.test(value);
}
