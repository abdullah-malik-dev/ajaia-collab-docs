import { NextResponse } from "next/server";
import { getDb } from "@/db/client";
import { parseJson, requireApiUser, route } from "@/lib/api";
import { updateDocumentSchema } from "@/lib/validation";
import { deleteDocument, getDocumentForUser, updateDocument } from "@/server/documents";

export const dynamic = "force-dynamic";

type Ctx = { params: { id: string } };

export const GET = route<Ctx>(async (_req, { params }) => {
  const user = await requireApiUser();
  const db = await getDb();
  const { doc, role } = await getDocumentForUser(db, params.id, user.id);
  return NextResponse.json({ ...doc, role });
});

export const PATCH = route<Ctx>(async (req, { params }) => {
  const user = await requireApiUser();
  const input = await parseJson(req, updateDocumentSchema);
  const db = await getDb();
  const doc = await updateDocument(db, params.id, user.id, input);
  return NextResponse.json(doc);
});

export const DELETE = route<Ctx>(async (_req, { params }) => {
  const user = await requireApiUser();
  const db = await getDb();
  await deleteDocument(db, params.id, user.id);
  return new NextResponse(null, { status: 204 });
});
