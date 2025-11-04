import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest) {
	const res = await auth.api.query({
		headers: req.headers,
		body: {
			featureId: "egsgsg",
			range: "90d",
		},
	});

	return NextResponse.json(res);
}
