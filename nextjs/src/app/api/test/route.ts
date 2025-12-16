"use server";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { Autumn } from "autumn-js";
const client = new Autumn({
  secretKey: process.env.AUTUMN_SECRET_KEY,
  url: "http://localhost:8080/v1",
});

export async function GET(req: NextRequest) {
  console.log("Running test better auth!");
  const res = await auth.api.track({
    headers: req.headers,
    body: {
      featureId: "tasks",
    },
  });

  const x = await client.events.aggregate({
    customer_id: "cus_123",
    feature_id: "tasks",
    range: "7d",
  });

  console.log("Res: ", res);

  return NextResponse.json(res);
}
