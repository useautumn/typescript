/**
 * Blacktriangle - Vercel-style pricing
 * Hobby (free) / Pro ($20/mo) / Enterprise (custom)
 */

import type { Feature, Plan } from "../../../../source/compose/models/index.js";

export const features: Feature[] = [
	{
		id: "bandwidth",
		name: "Bandwidth",
		type: "metered",
		consumable: true,
	},
	{
		id: "serverless_functions",
		name: "Serverless Functions",
		type: "boolean",
	},
	{
		id: "edge_network",
		name: "Edge Network",
		type: "boolean",
	},
	{
		id: "advanced_analytics",
		name: "Advanced Analytics",
		type: "boolean",
	},
	{
		id: "team_collaboration",
		name: "Team Collaboration",
		type: "boolean",
	},
	{
		id: "priority_support",
		name: "Priority Support",
		type: "boolean",
	},
	{
		id: "sso",
		name: "SSO & SAML",
		type: "boolean",
	},
];

export const plans: Plan[] = [
	{
		id: "hobby",
		name: "Hobby",
		description: "For personal projects and experimentation",
		features: [
			{ feature_id: "bandwidth", included: 100 }, // 100 GB
			{ feature_id: "serverless_functions" },
			{ feature_id: "edge_network" },
		],
	},
	{
		id: "pro",
		name: "Pro",
		description: "For professional developers and small teams",
		price: { amount: 20, interval: "month" },
		features: [
			{ feature_id: "bandwidth", included: 1000 }, // 1 TB
			{ feature_id: "serverless_functions" },
			{ feature_id: "edge_network" },
			{ feature_id: "advanced_analytics" },
			{ feature_id: "team_collaboration" },
			{ feature_id: "priority_support" },
		],
	},
	{
		id: "enterprise",
		name: "Enterprise",
		description: "For large organizations with custom needs",
		features: [
			{ feature_id: "bandwidth", unlimited: true },
			{ feature_id: "serverless_functions" },
			{ feature_id: "edge_network" },
			{ feature_id: "advanced_analytics" },
			{ feature_id: "team_collaboration" },
			{ feature_id: "priority_support" },
			{ feature_id: "sso" },
		],
	},
];
