import { NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/db/client";
import { parseJson, requireApiUser, route } from "@/lib/api";
import { resolveRequest } from "@/server/requests";

export const dynamic = "force-dynamic";

type Ctx = { params: { id: string; userId: string } };

const decisionSchema = z.object({ decision: z.enum(["approve", "decline"]) });

export const PATCH = route<Ctx>(async (req, { params }) => {
  const user = await requireApiUser();
  const { decision } = await parseJson(req, decisionSchema);
  const db = await getDb();
  await resolveRequest(db, params.id, user.id, params.userId, decision);
  return new NextResponse(null, { status: 204 });
});
