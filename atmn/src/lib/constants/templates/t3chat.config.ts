/**
 * T3 Chat - AI chat with message-based pricing
 * Free (100 std msgs) / Pro ($8/mo) / Premium Credits ($8 add-on)
 */

import type { Feature, Plan } from "../../../../source/compose/models/index.js";

export const features: Feature[] = [
	{
		id: "messages",
		name: "Messages",
		type: "metered",
		consumable: true,
	},
	{
		id: "premium_messages",
		name: "Premium Messages",
		type: "metered",
		consumable: true,
	},
	{
		id: "all_models",
		name: "All Models",
		type: "boolean",
	},
	{
		id: "priority_access",
		name: "Priority Access",
		type: "boolean",
	},
	{
		id: "faster_responses",
		name: "Faster Responses",
		type: "boolean",
	},
	{
		id: "file_uploads",
		name: "File Uploads",
		type: "boolean",
	},
];

export const plans: Plan[] = [
	{
		id: "free",
		name: "Free",
		description: "Get started with AI chat",
		features: [
			{ feature_id: "messages", included: 100, reset: { interval: "month" } },
		],
	},
	{
		id: "pro",
		name: "Pro",
		description: "More messages and premium features",
		price: { amount: 8, interval: "month" },
		features: [
			{ feature_id: "messages", included: 1500, reset: { interval: "month" } },
			{ feature_id: "premium_messages", included: 100, reset: { interval: "month" } },
			{ feature_id: "all_models" },
			{ feature_id: "priority_access" },
			{ feature_id: "faster_responses" },
			{ feature_id: "file_uploads" },
		],
	},
	{
		id: "premium_credits",
		name: "Premium Credits",
		description: "One-time purchase for premium messages",
		add_on: true,
		price: { amount: 8, interval: "one_off" },
		features: [
			{ feature_id: "premium_messages", included: 100 },
		],
	},
];
