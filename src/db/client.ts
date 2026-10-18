import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import * as schema from "./schema";

/**
 * A Drizzle Postgres handle. Services take this type so they run unchanged
 * against embedded PGlite (local dev, tests) and Neon (production).
 */
export type Db = PgDatabase<PgQueryResultHKT, typeof schema>;

type Cache = { db?: Db; ready?: Promise<void> };
const g = globalThis as unknown as { __ajaiaDb?: Cache };
const cache: Cache = (g.__ajaiaDb ??= {});

/** Returns the shared, bootstrapped database. Safe to call on every request. */
export async function getDb(): Promise<Db> {
  if (!cache.db) cache.db = await createDb();
  if (!cache.ready) {
    const { bootstrap } = await import("./bootstrap");
    cache.ready = bootstrap(cache.db).catch((err) => {
      cache.ready = undefined;
      throw err;
    });
  }
  await cache.ready;
  return cache.db;
}

async function createDb(): Promise<Db> {
  const url = process.env.DATABASE_URL;
  if (url) {
    const { neon } = await import("@neondatabase/serverless");
    const { drizzle } = await import("drizzle-orm/neon-http");
    return drizzle(neon(url), { schema }) as unknown as Db;
  }
  if (process.env.VERCEL || process.env.NODE_ENV === "production") {
    throw new Error(
      "DATABASE_URL is not set. Attach a Postgres database (for example Neon from the Vercel Storage tab) and redeploy.",
    );
  }
  const { PGlite } = await import("@electric-sql/pglite");
  const { drizzle } = await import("drizzle-orm/pglite");
  const dataDir = process.env.PGLITE_DATA_DIR ?? "./.data";
  return drizzle(new PGlite(dataDir), { schema }) as unknown as Db;
}

/** Fresh in-memory database for tests. Not cached. */
export async function createTestDb(): Promise<Db> {
  const { PGlite } = await import("@electric-sql/pglite");
  const { drizzle } = await import("drizzle-orm/pglite");
  const db = drizzle(new PGlite(), { schema }) as unknown as Db;
  const { bootstrap } = await import("./bootstrap");
  await bootstrap(db);
  return db;
}
