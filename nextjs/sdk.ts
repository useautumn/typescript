import "dotenv/config";

import { Autumn } from "@useautumn/sdk";

const main = async () => {
	const autumn = new Autumn({
		baseURL: "http://localhost:8080/v1",
		secretKey: process.env.AUTUMN_SECRET_KEY,
	});

	// console.log(`API version:`, autumn.apiVersion);

	// const customer = await autumn.customers.get("temp");
	// console.log(`Customer:`, customer);
	await autumn.plans.list({
		query: {
			customer_id: "customer_id",
		},
	});

	await autumn.customers.get("customer_id", {
		expand: ["subscriptions.plan"],
	});

	try {
		const deleted = await autumn.plans.delete("test-plan");
		console.log(`Deleted plan, response:`, deleted);
	} catch (error) {
		console.error(`Failed to delete plan: ${error}`);
	}

	const created = await autumn.plans.create({
		id: "test-plan",
		name: "Test Plan",
		description: "Test Description",
		price: {
			amount: 50,
			interval: "month",
		},
		features: [
			{
				feature_id: "messages",
				granted_balance: 40,
			},
		],
	});
	console.log(`Created plan, response:`, created);
};

main();
