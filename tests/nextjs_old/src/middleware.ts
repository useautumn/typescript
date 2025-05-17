import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";
import { updateSession } from "./lib/supabase/middleware";
import { clerkMiddleware } from "@clerk/nextjs/server";

const AUTH_PROVIDER: string = "supabase";
// const AUTH_PROVIDER: string = "clerk";

export default clerkMiddleware(async (auth, req) => {
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("auth-provider", AUTH_PROVIDER);

  if (AUTH_PROVIDER === "supabase") {
    return await updateSession(req);
  } else if (AUTH_PROVIDER === "better-auth") {
    const sessionCookie = getSessionCookie(req);
    if (!sessionCookie) {
      console.log("No session cookie found");
      return NextResponse.redirect(new URL("/better-auth", req.url));
    }
    return NextResponse.next();
  } else if (AUTH_PROVIDER === "clerk") {
    await auth.protect();
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/"], // Specify the routes the middleware applies to
};
