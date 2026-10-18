import { NextResponse } from "next/server";
import { getDb } from "@/db/client";
import { parseJson, requireApiUser, route } from "@/lib/api";
import { shareSchema } from "@/lib/validation";
import { addShare, listShares } from "@/server/shares";

export const dynamic = "force-dynamic";

type Ctx = { params: { id: string } };

export const GET = route<Ctx>(async (_req, { params }) => {
  const user = await requireApiUser();
  const db = await getDb();
  return NextResponse.json(await listShares(db, params.id, user.id));
});

export const POST = route<Ctx>(async (req, { params }) => {
  const user = await requireApiUser();
  const input = await parseJson(req, shareSchema);
  const db = await getDb();
  const share = await addShare(db, params.id, user.id, input);
  return NextResponse.json(share, { status: 201 });
});
