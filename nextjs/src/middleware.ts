import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";
import { updateSession } from "./lib/supabase/middleware";
import { clerkMiddleware } from "@clerk/nextjs/server";

const AUTH_PROVIDER: string = "better-auth";

export default clerkMiddleware(async (auth, req) => {
  const sessionCookie = getSessionCookie(req);
  if (!sessionCookie) {
    console.log("No session cookie found");
    return NextResponse.next();
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
