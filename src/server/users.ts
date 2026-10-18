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

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export function isUuid(value: string): boolean {
  return UUID_RE.test(value);
}
