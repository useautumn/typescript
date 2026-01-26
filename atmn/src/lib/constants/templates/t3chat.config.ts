/**
 * T3 Chat - Freemium chat app with message limits
 * Free (100 std msgs) / Pro ($8/mo) / Premium Credits (add-on)
 */

import type { Feature, Plan } from "../../../../source/compose/models/index.js";

export const features: Feature[] = [
	{
		id: "standard_messages",
		name: "Standard Messages",
		type: "metered",
		consumable: true,
	},
	{
		id: "premium_messages",
		name: "Premium Messages",
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
			{
				feature_id: "standard_messages",
				included: 100,
				reset: { interval: "month" },
			},
		],
	},
	{
		id: "pro",
		name: "Pro",
		price: { amount: 8, interval: "month" },
		features: [
			{
				feature_id: "standard_messages",
				included: 1500,
				reset: { interval: "month" },
			},
			{
				feature_id: "premium_messages",
				included: 100,
				reset: { interval: "month" },
			},
		],
	},
	{
		id: "premium-credits",
		name: "Premium Credits",
		add_on: true,
		price: { amount: 8, interval: "one_off" },
		features: [
			{
				feature_id: "premium_messages",
				included: 100,
				reset: { interval: "one_off" },
			},
		],
	},
];
