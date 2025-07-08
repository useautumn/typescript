"use client";
import { authClient } from "@/lib/auth-client";
import { useCustomer } from "autumn-js/react";
import { PricingTable } from "autumn-js/react";
import ShadcnPricingTable from "@/components/autumn/pricing-table";
import { Button } from "@/components/ui/button";

export default function Home() {
	const { customer, attach } = useCustomer();
	const autumn = authClient.useCustomer();

	// console.log("Customer:", customer);
	console.log("Autumn:", autumn);

	const productDetails = [
		{
			id: "free",
			name: "Free",
		},
		{
			id: "pro",
			name: "Pro",
			recommendText: "Lit",
		},
		{
			id: "premium",
			name: "Premium",
			price: 100,
		},
	];

	return (
		<div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 py-12 px-4">
			<main className="max-w-4xl mx-auto space-y-8">
				{/* Auth Test Section */}
				<section className="space-y-4">
					<h2 className="text-2xl font-semibold text-slate-800">
						Auth Testing
					</h2>
					<div className="flex gap-3">
						<Button
							variant="default"
							onClick={async () => {
								const res = await fetch(
									"http://localhost:3001/api/test",
									{
										method: "GET",
									}
								);
								console.log(res);
							}}
						>
							Test Better Auth Plugin
						</Button>
						<Button
							onClick={async () => {
								const res = await authClient.signIn.email({
									email: "johnyeo10@gmail.com",
									password: "testing123",
								});
								console.log(res);
							}}
						>
							Sign In
						</Button>
						<Button
							variant="outline"
							onClick={async () => {
								const res = await authClient.signUp.email({
									name: "John Yeo",
									email: "johnyeo10@gmail.com",
									password: "testing123",
								});
								console.log(res);
							}}
						>
							Sign Up
						</Button>
					</div>
				</section>
				{/* Debug Console Section */}
				<section className="space-y-4">
					<h2 className="text-2xl font-semibold text-slate-800">
						Debug Console
					</h2>
					<div className="bg-slate-900 rounded-lg shadow-lg overflow-hidden">
						<div className="flex items-center gap-2 px-4 py-2 bg-slate-800">
							<div className="flex gap-1.5">
								<div className="w-3 h-3 rounded-full bg-red-500"></div>
								<div className="w-3 h-3 rounded-full bg-yellow-500"></div>
								<div className="w-3 h-3 rounded-full bg-green-500"></div>
							</div>
							<span className="text-sm text-slate-400">
								Debug Output
							</span>
						</div>
						<div className="p-4 font-mono text-sm">
							<pre className="whitespace-pre-wrap text-green-400">
								{/* {JSON.stringify({ customer }, null, 2)} */}
							</pre>
							<pre className="whitespace-pre-wrap text-blue-400 mt-4">
								{JSON.stringify(autumn, null, 4)}
							</pre>
						</div>
					</div>
				</section>
				
				<div className="justify-center items-center grid grid-cols-10 gap-4">
					<Button
						className="bg-green-300 text-green-300"
						onClick={async () => {
							const res =
								await authClient.autumn.createReferralCode({
									programId: "test",
								});
							console.log(res);
						}}
					>
						Create Referral Code
					</Button>

					<Button
						className="bg-green-300 text-green-300"
						onClick={async () => {
							const res =
								await authClient.autumn.redeemReferralCode({
									code: "test",
								});
							console.log(res);
						}}
					>
						Redeem Referral Code
					</Button>

					<Button
						className="bg-green-300 text-green-300"
						onClick={async () => {
							const res = await authClient.autumn.listProducts();
							console.log(res);
						}}
					>
						List Products
					</Button>

					<Button className="bg-green-300 text-green-300"
						onClick={async () => {
							const res = await authClient.autumn.getBillingPortal();
							console.log(res);
						}}
					>
						Open Billing Portal
					</Button>

					<Button
						className="bg-green-300 text-green-300"
						onClick={async () => {
							const res = await authClient.autumn.cancel({
								productId: "pro",
							});
							console.log(res);
						}}
					>
						Cancel
					</Button>

					<Button
						className="bg-green-300 text-green-300"
						onClick={async () => {
							const res = await authClient.autumn.check({
								featureId: "messages",
              });
							console.log(res);
						}}
					>
						Check
					</Button>

					<Button
						className="bg-green-300 text-green-300"
						onClick={async () => {
							const res = await authClient.autumn.track({
								featureId: "messages",
							});
							console.log(res);
						}}
					>
						Track
					</Button>

					<Button
						className="bg-green-300 text-green-300"
						onClick={async () => {
							const res = await authClient.autumn.attach({
								productId: "propro",
								successUrl: "http://localhost:3001/",
							});
							console.log(res);
						}}
					>
						Attach
					</Button>

					<Button
						className="bg-green-300 text-green-300"
						onClick={async () => {
							const allowed = authClient.autumn.allowed({
								featureId: "messages",
							});
							console.log("Allowed:", allowed);
						}}
					>
						Allowed
					</Button>

					{/* {authClient.autumn.allowed({
						featureId: "messages",
					}) && (
						<Button className="bg-green-300 text-green-300">
							Conditional Rendering with Allowed Works!
						</Button>
					)} */}
				</div>
			</main>
		</div>
	);
}
