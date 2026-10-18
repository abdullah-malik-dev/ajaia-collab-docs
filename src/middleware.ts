import { NextResponse, type NextRequest } from "next/server";

const SESSION_COOKIE = "ajaia_uid";

/**
 * Presence check only: the edge runtime cannot reach the database.
 * Pages and route handlers verify the user actually exists.
 */
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const signedIn = Boolean(req.cookies.get(SESSION_COOKIE)?.value);

  if (pathname === "/login") {
    return signedIn ? NextResponse.redirect(new URL("/", req.url)) : NextResponse.next();
  }
  if (signedIn) return NextResponse.next();

  if (pathname.startsWith("/api/")) {
    return NextResponse.json(
      { error: { code: "unauthenticated", message: "Sign in to continue." } },
      { status: 401 },
    );
  }
  const login = new URL("/login", req.url);
  if (pathname !== "/") login.searchParams.set("next", pathname);
  return NextResponse.redirect(login);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
