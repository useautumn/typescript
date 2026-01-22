/**
 * Linear - Project management with per-seat pricing
 * Free (2 teams, 250 issues) / Basic ($12/seat/mo) / Business ($18/seat/mo)
 */

import type { Feature, Plan } from "../../../../source/compose/models/index.js";

export const features: Feature[] = [
	{
		id: "seats",
		name: "Seats",
		type: "metered",
		consumable: false,
	},
	{
		id: "teams",
		name: "Teams",
		type: "metered",
		consumable: false,
	},
	{
		id: "issues",
		name: "Issues",
		type: "metered",
		consumable: true,
	},
];

export const plans: Plan[] = [
	{
		id: "free",
		name: "Free",
		auto_enable: true,
		features: [
			{ feature_id: "teams", included: 2 },
			{ feature_id: "issues", included: 250, reset: { interval: "one_off" } },
			{ feature_id: "seats", unlimited: true },
		],
	},
	{
		id: "basic",
		name: "Basic",
		price: { amount: 12, interval: "month" },
		features: [
			{
				feature_id: "seats",
				included: 1,
				price: {
					amount: 12,
					billing_method: "usage_based",
					billing_units: 1,
				},
			},
			{ feature_id: "teams", included: 5 },
			{ feature_id: "issues", unlimited: true },
		],
	},
	{
		id: "business",
		name: "Business",
		price: { amount: 18, interval: "month" },
		features: [
			{
				feature_id: "seats",
				included: 1,
				price: {
					amount: 18,
					billing_method: "usage_based",
					billing_units: 1,
				},
			},
			{ feature_id: "teams", unlimited: true },
			{ feature_id: "issues", unlimited: true },
		],
	},
];
