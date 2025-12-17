"use client";
import { useAggregateEvents, useCustomer } from "autumn-js/react";
import PricingTable from "@/components/autumn/pricing-table";
import { CustomerDataViewer } from "@/components/customer-data-viewer";
import { TestBetterAuth } from "@/components/test-better-auth";
import TestButtons from "@/components/test-buttons";
import { authClient } from "@/lib/auth-client";
import { EventListViewer } from "../components/event-list-viewer";

export default function Home() {
	const {
		data: session,

		isPending,
	} = authClient.useSession();

	const { customer } = useCustomer({ expand: ["invoices"] });

	const { list, total, isLoading } = useAggregateEvents({
		featureId: "revenue",
		range: "24h",
		binSize: "day",
	});

	console.log(list, total, isLoading);

	if (isPending) return <div>Loading...</div>;
	else
		return (
			<div className="min-h-screen w-screen flex">
				<div className="flex-1 min-h-screen overflow-y-auto p-10 space-y-8">
					<h2 className="text-2xl font-bold">Actions & Pricing</h2>

					<PricingTable />
					<TestBetterAuth />
					<TestButtons />
				</div>

				{/* Right Column - Data Display */}
				<div className="flex-1 min-h-screen overflow-y-auto p-10 space-y-6 gap-y-4">
					<h2 className="text-2xl font-bold">Data</h2>

					{session && (
						<details className="p-4 rounded-lg">
							<summary className="text-lg font-semibold mb-2 cursor-pointer hover:text-blue-600">
								Session
							</summary>
							<div className="space-y-1 mt-4">
								<p>
									<span className="font-medium">User ID:</span>{" "}
									{session.user.id}
								</p>
								<p>
									<span className="font-medium">Name:</span> {session.user.name}
								</p>
								<p>
									<span className="font-medium">Email:</span>{" "}
									{session.user.email}
								</p>
								<p>
									<span className="font-medium">Session ID:</span>{" "}
									{session.session.id}
								</p>
								{session.session.activeOrganizationId && (
									<p>
										<span className="font-medium">Active Org ID:</span>{" "}
										{session.session.activeOrganizationId}
									</p>
								)}
							</div>
						</details>
					)}

					{customer && <CustomerDataViewer customer={customer} />}
				</div>
				<EventListViewer />
			</div>
		);
}
