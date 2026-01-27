/** biome-ignore-all lint/correctness/useHookAtTopLevel: <expanation> */
import "dotenv/config";
import { Autumn } from "autumn-js";
import { useCustomer } from "autumn-js/react";

const main = async () => {
	const autumn = new Autumn({
		secretKey: process.env.AUTUMN_SEbCRET_KEY,
		url: "http://localhost:8080/v1",
	});

	const customer = await autumn.customers.create({
		id: "1234",
		name: "John Doe",
		email: "john.doe@example.com",
	});
	console.log(customer);
};

main();
