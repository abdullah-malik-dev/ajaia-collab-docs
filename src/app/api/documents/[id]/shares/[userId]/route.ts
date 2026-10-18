import { NextResponse } from "next/server";
import { getDb } from "@/db/client";
import { requireApiUser, route } from "@/lib/api";
import { removeShare } from "@/server/shares";

export const dynamic = "force-dynamic";

type Ctx = { params: { id: string; userId: string } };

export const DELETE = route<Ctx>(async (_req, { params }) => {
  const user = await requireApiUser();
  const db = await getDb();
  await removeShare(db, params.id, user.id, params.userId);
  return new NextResponse(null, { status: 204 });
});
