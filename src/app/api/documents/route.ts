import { NextResponse } from "next/server";
import { getDb } from "@/db/client";
import { parseJson, requireApiUser, route } from "@/lib/api";
import { createDocumentSchema } from "@/lib/validation";
import { createDocument, listDocumentsForUser } from "@/server/documents";

export const dynamic = "force-dynamic";

export const GET = route(async () => {
  const user = await requireApiUser();
  const db = await getDb();
  return NextResponse.json(await listDocumentsForUser(db, user.id));
});

export const POST = route(async (req) => {
  const user = await requireApiUser();
  const input = await parseJson(req, createDocumentSchema);
  const db = await getDb();
  const doc = await createDocument(db, user.id, input);
  return NextResponse.json(doc, { status: 201 });
});
