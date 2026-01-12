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
		console.log(customer.entities)
		console.log(customer.invoices)
		console.log(customer.referrals)
		console.log(customer.rewards)
		console.log(customer.trials_used)
		console.log(customer.payment_method)
	}
};

main();
