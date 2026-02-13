import { feature, plan, planFeature } from "atmn";

export const tokens = feature({
	id: "api_tokens",
	name: "API Tokens",
	type: "metered",
	consumable: true,
});

export const images = feature({
	id: "image_units",
	name: "Image Units",
	type: "metered",
	consumable: true,
});

export const team = plan({
	id: "team",
	name: "Team",
	auto_enable: true,
	items: [
		planFeature({
			feature_id: tokens.id,
			included: 5000,
			reset: { interval: "month" },
		}),
		planFeature({
			feature_id: images.id,
			included: 250,
			reset: { interval: "month" },
		}),
	],
});
