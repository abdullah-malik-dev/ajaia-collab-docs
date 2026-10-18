import { NextResponse } from "next/server";
import { ZodError, type ZodType } from "zod";
import { ServiceError, type ErrorCode } from "@/server/errors";
import { getCurrentUser } from "@/lib/session";
import type { User } from "@/db/schema";

/**
 * Every API error has this shape:
 *   { error: { code, message, details? } }
 */
export type ApiErrorBody = { error: { code: ErrorCode; message: string; details?: unknown } };

const STATUS: Record<ErrorCode, number> = {
  unauthenticated: 401,
  not_found: 404,
  forbidden: 403,
  conflict: 409,
  validation: 400,
  unsupported_file: 415,
  file_too_large: 413,
  internal: 500,
};

export function errorResponse(err: unknown): NextResponse<ApiErrorBody> {
  if (err instanceof ServiceError) {
    return NextResponse.json(
      { error: { code: err.code, message: err.message, details: err.details } },
      { status: STATUS[err.code] },
    );
  }
  if (err instanceof ZodError) {
    const first = err.issues[0];
    return NextResponse.json(
      {
        error: {
          code: "validation",
          message: first?.message ?? "Invalid request.",
          details: err.issues.map((i) => ({ path: i.path.join("."), message: i.message })),
        },
      },
      { status: 400 },
    );
  }
  console.error(err);
  return NextResponse.json(
    { error: { code: "internal", message: "Something went wrong. Try again." } },
    { status: 500 },
  );
}

type Handler<Ctx> = (req: Request, ctx: Ctx) => Promise<Response>;

/** Wraps a route handler so thrown errors become consistent JSON responses. */
export function route<Ctx = unknown>(handler: Handler<Ctx>): Handler<Ctx> {
  return async (req, ctx) => {
    try {
      return await handler(req, ctx);
    } catch (err) {
      return errorResponse(err);
    }
  };
}

export async function requireApiUser(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) throw new ServiceError("unauthenticated", "Sign in to continue.");
  return user;
}

/** Parses a JSON body against a schema; malformed JSON is a validation error. */
export async function parseJson<T>(req: Request, schema: ZodType<T>): Promise<T> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    throw new ServiceError("validation", "Request body must be JSON.");
  }
  return schema.parse(body);
}
