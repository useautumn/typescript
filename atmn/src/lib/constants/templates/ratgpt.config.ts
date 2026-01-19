/**
 * RatGPT - ChatGPT-style pricing
 * Free / Plus ($20/mo) / Team ($25/user/mo)
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
		id: "advanced_models",
		name: "Advanced AI Models",
		type: "boolean",
	},
	{
		id: "image_generation",
		name: "Image Generation",
		type: "boolean",
	},
	{
		id: "voice_mode",
		name: "Voice Mode",
		type: "boolean",
	},
	{
		id: "file_uploads",
		name: "File Uploads",
		type: "boolean",
	},
	{
		id: "team_seats",
		name: "Team Seats",
		type: "metered",
		consumable: false, // Seats are not consumed, they accumulate
	},
	{
		id: "admin_console",
		name: "Admin Console",
		type: "boolean",
	},
];

export const plans: Plan[] = [
	{
		id: "free",
		name: "Free",
		description: "Get started with basic AI capabilities",
		features: [
			{ feature_id: "messages", included: 50, interval: "day" },
		],
	},
	{
		id: "plus",
		name: "Plus",
		description: "Enhanced AI with unlimited access",
		price: { amount: 20, interval: "month" },
		features: [
			{ feature_id: "messages", unlimited: true },
			{ feature_id: "advanced_models" },
			{ feature_id: "image_generation" },
			{ feature_id: "voice_mode" },
			{ feature_id: "file_uploads" },
		],
	},
	{
		id: "team",
		name: "Team",
		description: "Collaborate with your entire team",
		price: { amount: 25, interval: "month" },
		features: [
			{ feature_id: "messages", unlimited: true },
			{ feature_id: "advanced_models" },
			{ feature_id: "image_generation" },
			{ feature_id: "voice_mode" },
			{ feature_id: "file_uploads" },
			{
				feature_id: "team_seats",
				interval: "month",
				price: { amount: 25, billing_method: "pay_per_use", billing_units: 1 },
			},
			{ feature_id: "admin_console" },
		],
	},
];
