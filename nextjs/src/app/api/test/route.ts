"use server";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  console.log("Running test better auth!");
  const res = await auth.api.check({
    headers: req.headers,
    body: {
      featureId: "tasks",
      // requiredBalance: 26,
    },
  });

  return NextResponse.json(res);
}
