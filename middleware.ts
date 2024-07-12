// Import fs module for file operations
import type { NextRequest } from "next/server";

import { NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const userAccount = request.cookies.get("userAccount");
  const ARTIST_ACCOUNT_NUMBER =
    process.env.NEXT_PUBLIC_MUSIC_ARTIST_DEFAULT_ADDRESS || "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";

  if (path !== "/" && userAccount && userAccount["value"].toLowerCase() === ARTIST_ACCOUNT_NUMBER.toLowerCase()) {
    return NextResponse.redirect(new URL("/not-found", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/tokens", "/resales"]
};

// This middleware is crucial for several reasons:

// 1. **Path Validation**: It checks the path of the incoming request. If the request is not targeting the root ("/"), it proceeds with further validations. This is important for protecting specific routes or ensuring that some operations can only be performed from certain pages.

// 2. **User Account Verification**: By accessing the `userAccount` cookie, the middleware verifies the identity of the user making the request. This is essential for personalized user experiences or for routes that should be accessible only by specific users.

// 3. **Artist Account Check**: The middleware compares the user account against a predefined artist account number (either from an environment variable or a hardcoded default). This step is crucial for restricting access to certain routes only to the artist's account. It ensures that sensitive or artist-specific pages are not accessible by other users.

// 4. **Redirection**: If the user trying to access non-root paths is identified as the artist (based on the account number), they are redirected to a "/not-found" page. This could be a security measure to prevent the artist's account from accessing certain areas of the site or to customize the user experience.

// 5. **Route Matching**: The `config` object with the `matcher` property specifies which paths this middleware applies to. In this case, it's limited to "/tokens" and "/resales". This selective application prevents the middleware from running on every request, optimizing performance and ensuring that the checks are only performed where necessary.

// Overall, this middleware serves as a gatekeeper, ensuring that only authorized users can access specific routes and that the artist's account is treated differently from regular users for certain paths.
