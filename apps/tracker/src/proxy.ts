import { NextResponse } from "next/server";

// Route proxy — replace with @pmg/auth session check in Phase 4
// For now all routes pass through so the app can be tested without auth

export function proxy() {
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
