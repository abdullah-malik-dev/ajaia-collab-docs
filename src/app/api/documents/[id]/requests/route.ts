import { NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/db/client";
import { parseJson, requireApiUser, route } from "@/lib/api";
import { listPendingRequests, requestAccess } from "@/server/requests";

export const dynamic = "force-dynamic";

type Ctx = { params: { id: string } };

const requestSchema = z.object({ role: z.enum(["viewer", "editor"]) });

export const GET = route<Ctx>(async (_req, { params }) => {
  const user = await requireApiUser();
  const db = await getDb();
  return NextResponse.json(await listPendingRequests(db, params.id, user.id));
});

export const POST = route<Ctx>(async (req, { params }) => {
  const user = await requireApiUser();
  const { role } = await parseJson(req, requestSchema);
  const db = await getDb();
  const request = await requestAccess(db, params.id, user.id, role);
  return NextResponse.json(request, { status: 201 });
});
