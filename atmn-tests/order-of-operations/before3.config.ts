import { feature, plan, planFeature } from "atmn";

export const removable = feature({
	id: "remove_in_sync",
	name: "Remove in Plan",
	type: "metered",
	consumable: true,
});

export const legacyPlan = plan({
	id: "legacy_plan",
	name: "Legacy Plan",
	items: [
		planFeature({
			feature_id: removable.id,
			included: 5,
			reset: { interval: "month" },
		}),
	],
});

export const stable = plan({
	id: "stable",
	name: "Stable",
	auto_enable: true,
	items: [],
});
