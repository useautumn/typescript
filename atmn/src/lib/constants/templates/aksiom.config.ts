/**
 * Aksiom - Axiom-style pricing (observability/logging)
 * Starter (free) / Pro ($25/mo) / Enterprise (custom)
 */

import type { Feature, Plan } from "../../../../source/compose/models/index.js";

export const features: Feature[] = [
	{
		id: "ingest",
		name: "Data Ingest",
		type: "metered",
		consumable: true,
	},
	{
		id: "retention_days",
		name: "Data Retention",
		type: "metered",
		consumable: false,
	},
	{
		id: "dashboards",
		name: "Custom Dashboards",
		type: "boolean",
	},
	{
		id: "advanced_queries",
		name: "Advanced Queries",
		type: "boolean",
	},
	{
		id: "team_access",
		name: "Team Access",
		type: "boolean",
	},
	{
		id: "api_access",
		name: "API Access",
		type: "boolean",
	},
	{
		id: "sso_rbac",
		name: "SSO & RBAC",
		type: "boolean",
	},
	{
		id: "sla",
		name: "SLA Guarantee",
		type: "boolean",
	},
];

export const plans: Plan[] = [
	{
		id: "starter",
		name: "Starter",
		description: "For small projects and experimentation",
		features: [
			{ feature_id: "ingest", included: 1 }, // 1 GB/mo
			{ feature_id: "retention_days", included: 7 },
		],
	},
	{
		id: "pro",
		name: "Pro",
		description: "For growing teams and production workloads",
		price: { amount: 25, interval: "month" },
		features: [
			{ feature_id: "ingest", included: 50 }, // 50 GB/mo
			{ feature_id: "retention_days", included: 30 },
			{ feature_id: "dashboards" },
			{ feature_id: "advanced_queries" },
			{ feature_id: "team_access" },
			{ feature_id: "api_access" },
		],
	},
	{
		id: "enterprise",
		name: "Enterprise",
		description: "For large organizations with compliance needs",
		features: [
			{ feature_id: "ingest", unlimited: true },
			{ feature_id: "retention_days", included: 90 },
			{ feature_id: "dashboards" },
			{ feature_id: "advanced_queries" },
			{ feature_id: "team_access" },
			{ feature_id: "api_access" },
			{ feature_id: "sso_rbac" },
			{ feature_id: "sla" },
		],
	},
];
