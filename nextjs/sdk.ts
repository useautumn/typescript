/** biome-ignore-all lint/correctness/useHookAtTopLevel: <expanation> */
import "dotenv/config";
import { Autumn } from "autumn-js";

const main = async () => {
	const autumn = new Autumn({
		secretKey: process.env.AUTUMN_SECRET_KEY,
	});

	// Example: v2.billing.attach
	const attachRes = await autumn.v2.billing.previewMultiAttach({
		customer_id: "john",
		plans: [
			{
				plan_id: "ultra",
			},
			{
				plan_id: "volume_based_product",
				feature_quantities: [
					{
						feature_id: "chat_messages",
						quantity: 200,
					},
				],
			},
		],
	});

	console.log(attachRes);

	// // Example: v2.billing.update
	// const updateRes = await autumn.v2.billing.update({
	// 	customer_id: "cus_123",
	// 	plan_id: "pro_plan",
	// 	cancel_action: "cancel_end_of_cycle",
	// });

	// console.log(updateRes);
};

main();
