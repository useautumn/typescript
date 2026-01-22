/**
 * Railway - Credit-based infrastructure pricing
 * Free (500 credits) / Hobby ($5/mo) / Pro ($20/mo)
 * 1 credit = $0.01
 */

import type { Feature, Plan } from "../../../../source/compose/models/index.js";

export const features: Feature[] = [
	{
		id: "credits",
		name: "Credits",
		type: "credit_system",
		credit_schema: [
			{ metered_feature_id: "memory", credit_cost: 0.039 },
			{ metered_feature_id: "cpu", credit_cost: 0.078 },
			{ metered_feature_id: "egress", credit_cost: 5 },
			{ metered_feature_id: "storage", credit_cost: 1.5 },
		],
	},
	{
		id: "memory",
		name: "Memory",
		type: "metered",
		consumable: true,
	},
	{
		id: "cpu",
		name: "CPU",
		type: "metered",
		consumable: true,
	},
	{
		id: "egress",
		name: "Egress",
		type: "metered",
		consumable: true,
	},
	{
		id: "storage",
		name: "Storage",
		type: "metered",
		consumable: true,
	},
];

export const plans: Plan[] = [
	{
		id: "free",
		name: "Free",
		auto_enable: true,
		features: [{ feature_id: "credits", included: 500 }],
	},
	{
		id: "hobby",
		name: "Hobby",
		price: { amount: 5, interval: "month" },
		features: [
			{
				feature_id: "credits",
				included: 500,
				price: {
					amount: 0.01,
					billing_method: "usage_based",
					billing_units: 1,
				},
			},
		],
	},
	{
		id: "pro",
		name: "Pro",
		price: { amount: 20, interval: "month" },
		features: [
			{
				feature_id: "credits",
				included: 2000,
				price: {
					amount: 0.01,
					billing_method: "usage_based",
					billing_units: 1,
				},
			},
		],
	},
];
