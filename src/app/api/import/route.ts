import { NextResponse } from "next/server";
import { getDb } from "@/db/client";
import { requireApiUser, route } from "@/lib/api";
import { UPLOAD_MAX_BYTES } from "@/lib/validation";
import { createDocument } from "@/server/documents";
import { ServiceError } from "@/server/errors";
import { convertUpload, SUPPORTED_TYPES_LABEL } from "@/server/import";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** multipart/form-data with a single `file` field. Creates a new document owned by the caller. */
export const POST = route(async (req) => {
  const user = await requireApiUser();

  const declared = Number(req.headers.get("content-length") ?? 0);
  if (declared > UPLOAD_MAX_BYTES * 1.2) {
    throw new ServiceError("file_too_large", "That file is over 2 MB.");
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    throw new ServiceError("validation", "Expected a multipart form with a file.");
  }
  const file = form.get("file");
  if (!(file instanceof File)) {
    throw new ServiceError("validation", `Choose a ${SUPPORTED_TYPES_LABEL} file to import.`);
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const { title, content } = await convertUpload({ name: file.name, bytes });

  const db = await getDb();
  const doc = await createDocument(db, user.id, { title, content });
  return NextResponse.json({ id: doc.id, title: doc.title }, { status: 201 });
});
