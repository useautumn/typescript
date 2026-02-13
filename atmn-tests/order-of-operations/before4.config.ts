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

export const credits = feature({
	id: "compute_credits",
	name: "Compute Credits",
	type: "credit_system",
	credit_schema: [
		{
			metered_feature_id: tokens.id,
			credit_cost: 2,
		},
		{
			metered_feature_id: images.id,
			credit_cost: 5,
		},
	],
});

export const team = plan({
	id: "team",
	name: "Team",
	auto_enable: true,
	items: [
		planFeature({
			feature_id: credits.id,
			included: 10000,
			reset: { interval: "month" },
		}),
	],
});
