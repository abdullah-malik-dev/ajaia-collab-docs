import { jsonb, pgTable, primaryKey, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
});

export const documents = pgTable("documents", {
  id: uuid("id").primaryKey(),
  title: text("title").notNull(),
  content: jsonb("content").notNull().$type<DocContent>(),
  ownerId: uuid("owner_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const documentShares = pgTable(
  "document_shares",
  {
    documentId: uuid("document_id")
      .notNull()
      .references(() => documents.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: text("role").notNull().$type<ShareRole>(),
  },
  (t) => ({ pk: primaryKey({ columns: [t.documentId, t.userId] }) }),
);

export const accessRequests = pgTable(
  "access_requests",
  {
    documentId: uuid("document_id")
      .notNull()
      .references(() => documents.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    requestedRole: text("requested_role").notNull().$type<ShareRole>(),
    status: text("status").notNull().$type<RequestStatus>().default("pending"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({ pk: primaryKey({ columns: [t.documentId, t.userId] }) }),
);

export type ShareRole = "viewer" | "editor";
export type RequestStatus = "pending" | "approved" | "declined";

/** TipTap/ProseMirror JSON document. Kept loose on purpose; the editor owns the exact shape. */
export type DocContent = { type: "doc"; content?: unknown[] };

export type User = typeof users.$inferSelect;
export type Document = typeof documents.$inferSelect;
export type DocumentShare = typeof documentShares.$inferSelect;
export type AccessRequest = typeof accessRequests.$inferSelect;
