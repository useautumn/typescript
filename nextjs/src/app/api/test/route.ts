import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const data = await auth.api.createCustomer({
    headers: req.headers,
    body: {
      expand: ["invoices"],
    },
  });

  console.log(data);
  return NextResponse.json(data);
}
