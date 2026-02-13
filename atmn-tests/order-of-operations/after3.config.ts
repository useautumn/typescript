import { feature, plan } from "atmn";

export const core = feature({
	id: "core",
	name: "Core Feature",
	type: "metered",
	consumable: false,
});

export const stable = plan({
	id: "stable",
	name: "Stable",
	auto_enable: true,
	items: [
		{
			feature_id: core.id,
			included: 100,
			reset: { interval: "month" },
		},
	],
});
