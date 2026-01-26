/**
 * OpenAI - API-style pricing with credit system
 * Free (2000 credits) / Credits Top-Up (prepaid add-on)
 * 1 credit = $0.001
 */

import type { Feature, Plan } from "../../../../source/compose/models/index.js";

export const features: Feature[] = [
	{
		id: "credits",
		name: "Credits",
		type: "credit_system",
		credit_schema: [
			{ metered_feature_id: "gpt5_mini_input", credit_cost: 0.25 },
			{ metered_feature_id: "gpt5_mini_output", credit_cost: 2 },
			{ metered_feature_id: "gpt52_input", credit_cost: 1.75 },
			{ metered_feature_id: "gpt52_output", credit_cost: 14 },
			{ metered_feature_id: "gpt52_pro_input", credit_cost: 21 },
			{ metered_feature_id: "gpt52_pro_output", credit_cost: 168 },
		],
	},
	{
		id: "gpt5_mini_input",
		name: "GPT-5 Mini Input",
		type: "metered",
		consumable: true,
	},
	{
		id: "gpt5_mini_output",
		name: "GPT-5 Mini Output",
		type: "metered",
		consumable: true,
	},
	{
		id: "gpt52_input",
		name: "GPT-5.2 Input",
		type: "metered",
		consumable: true,
	},
	{
		id: "gpt52_output",
		name: "GPT-5.2 Output",
		type: "metered",
		consumable: true,
	},
	{
		id: "gpt52_pro_input",
		name: "GPT-5.2 Pro Input",
		type: "metered",
		consumable: true,
	},
	{
		id: "gpt52_pro_output",
		name: "GPT-5.2 Pro Output",
		type: "metered",
		consumable: true,
	},
];

export const plans: Plan[] = [
	{
		id: "free",
		name: "Free",
		auto_enable: true,
		features: [{ feature_id: "credits", included: 2000, reset: { interval: "one_off" } }],
	},
	{
		id: "credits-top-up",
		name: "Credits Top-Up",
		add_on: true,
		features: [
			{
				feature_id: "credits",
				price: { amount: 10, billing_method: "prepaid", billing_units: 10000, interval: "one_off" },
			},
		],
	},
];
