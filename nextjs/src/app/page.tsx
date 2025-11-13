"use client";
import { PricingTable, useCustomer } from "autumn-js/react";
import TestButtons from "@/components/test-buttons";

export default function Home() {
	const overrides = [
		{
			planId: "pro",
			name: "Pro",

			button: {
				text: "Heyo",
				onClick: async () => {
					console.log("Hello World");
				},
			},

			price: {
				display: {
					primaryText: "100",
					secondaryText: "USD",
				},
			},

			features: [
				{
					featureId: "workflows",
					display: {
						primaryText: "Checking something's up!",
					},
				},
				{
					featureId: null,
					display: {
						primaryText: "Testing what's up ya'll",
					},
				},
			],
		},
	];

	const { data: customer } = useCustomer();

	console.log(customer);
	return (
		<div className="min-h-screen w-screen flex">
			<div className="flex-1 min-h-screen overflow-y-auto p-10 space-y-8">
				<h2 className="text-2xl font-bold">Actions & Pricing</h2>

				<PricingTable overrides={overrides} />
				<TestButtons />
			</div>
		</div>
	);
}
