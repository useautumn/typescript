/** biome-ignore-all lint/correctness/useHookAtTopLevel: <expanation> */
import "dotenv/config";
import { Autumn } from "autumn-js";
import { useCustomer } from "autumn-js/react";

const main = async () => {
	const autumn = new Autumn({
		secretKey: process.env.AUTUMN_SECRET_KEY,
	});

	const { customer } = useCustomer({
		expand: ["entities", "invoices", "rewards", "trials_used", "payment_method"],
	});

	if (customer) {
		console.log(customer.subscriptions)
	}
};

main();
