import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export async function GET(request: NextRequest) {
    let data = await auth.api.createReferralCode({
        body: {
            programId: "123",
        }
    })
    return NextResponse.json(data);
}
