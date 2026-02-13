import { feature, plan, planFeature } from "atmn";

export const core = feature({
	id: "core",
	name: "Core Feature",
	type: "metered",
	consumable: false,
});

export const pro = plan({
	id: "pro",
	name: "Pro",
	auto_enable: true,
	items: [
		planFeature({
			feature_id: core.id,
			included: 20,
			reset: { interval: "month" },
		}),
	],
});
