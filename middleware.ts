// Import fs module for file operations
import type { NextRequest } from "next/server";

import { NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const userAccount = request.cookies.get("userAccount");
  const ARTIST_ACCOUNT_NUMBER = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";

  if (path !== "/" && userAccount && userAccount["value"].toLowerCase() === ARTIST_ACCOUNT_NUMBER.toLowerCase()) {
    return NextResponse.redirect(new URL("/not-found", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/tokens", "/resales"]
};
