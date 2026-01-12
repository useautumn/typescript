import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET() {
	const orgs = await auth.api.listOrganizations();

	console.log("Orgs list", orgs);

	const res = await auth.api.deleteOrganization({
		headers: new Headers(),
		body: {
			organizationId: "test-organization-2",
		},
	});

	const res2 = await auth.api.deleteOrganization({
		headers: new Headers(),
		body: {
			organizationId: "test-organization",
		},
	});

	return NextResponse.json({ res, res2 });
}
