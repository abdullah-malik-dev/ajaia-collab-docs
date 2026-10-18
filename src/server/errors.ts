export type ErrorCode =
  | "unauthenticated"
  | "not_found"
  | "forbidden"
  | "conflict"
  | "validation"
  | "unsupported_file"
  | "file_too_large"
  | "internal";

/** Thrown by services; the route layer maps it to an HTTP status. */
export class ServiceError extends Error {
  constructor(
    public readonly code: ErrorCode,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = "ServiceError";
  }
}

export const notFound = (what = "Document") =>
  new ServiceError("not_found", `${what} not found.`);
export const forbidden = (message: string) => new ServiceError("forbidden", message);
export const conflict = (message: string, details?: unknown) =>
  new ServiceError("conflict", message, details);
