import { feature, plan, planFeature } from "atmn";

export const messages = feature({
	id: "messages",
	name: "Messages",
	type: "metered",
	consumable: true,
});

export const starter = plan({
	id: "starter",
	name: "Starter",
	auto_enable: true,
	items: [
		planFeature({
			feature_id: messages.id,
			included: 1000,
			reset: { interval: "month" },
		}),
	],
});
