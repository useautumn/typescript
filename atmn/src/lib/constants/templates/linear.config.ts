/**
 * Linear - Per-seat project management pricing
 * Free (2 teams, 250 issues) / Basic ($12/user/mo) / Business ($18/user/mo)
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
		consumable: false,
	},
	{
		id: "integrations",
		name: "Integrations",
		type: "boolean",
	},
	{
		id: "cycles_roadmaps",
		name: "Cycles & Roadmaps",
		type: "boolean",
	},
	{
		id: "guest_access",
		name: "Guest Access",
		type: "boolean",
	},
	{
		id: "saml_sso",
		name: "SAML SSO",
		type: "boolean",
	},
	{
		id: "audit_logs",
		name: "Audit Logs",
		type: "boolean",
	},
];

export const plans: Plan[] = [
	{
		id: "free",
		name: "Free",
		description: "For small teams getting started",
		features: [
			{ feature_id: "teams", included: 2 },
			{ feature_id: "issues", included: 250 },
		],
	},
	{
		id: "basic",
		name: "Basic",
		description: "For growing teams with more projects",
		price: { amount: 12, interval: "month" },
		features: [
			{
				feature_id: "seats",
				reset: { interval: "month" },
				price: { amount: 12, billing_method: "usage_based", billing_units: 1 },
			},
			{ feature_id: "teams", included: 5 },
			{ feature_id: "issues", unlimited: true },
			{ feature_id: "integrations" },
			{ feature_id: "cycles_roadmaps" },
			{ feature_id: "guest_access" },
		],
	},
	{
		id: "business",
		name: "Business",
		description: "For organizations with advanced needs",
		price: { amount: 18, interval: "month" },
		features: [
			{
				feature_id: "seats",
				reset: { interval: "month" },
				price: { amount: 18, billing_method: "usage_based", billing_units: 1 },
			},
			{ feature_id: "teams", unlimited: true },
			{ feature_id: "issues", unlimited: true },
			{ feature_id: "integrations" },
			{ feature_id: "cycles_roadmaps" },
			{ feature_id: "guest_access" },
			{ feature_id: "saml_sso" },
			{ feature_id: "audit_logs" },
		],
	},
];
