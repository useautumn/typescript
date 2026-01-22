/**
 * Railway - Credit-based infrastructure pricing
 * Free (500 one-time credits) / Hobby ($5/mo) / Pro ($20/mo)
 * 1 credit = $0.01
 */

import type { Feature, Plan } from "../../../../source/compose/models/index.js";

export const features: Feature[] = [
	{
		id: "credits",
		name: "Credits",
		type: "metered",
		consumable: true,
	},
	{
		id: "memory_gb_hours",
		name: "Memory (GB-hours)",
		type: "metered",
		consumable: true,
	},
	{
		id: "cpu_vcpu_hours",
		name: "CPU (vCPU-hours)",
		type: "metered",
		consumable: true,
	},
	{
		id: "egress_gb",
		name: "Egress (GB)",
		type: "metered",
		consumable: true,
	},
	{
		id: "storage_gb",
		name: "Storage (GB-month)",
		type: "metered",
		consumable: true,
	},
	{
		id: "team_members",
		name: "Team Members",
		type: "metered",
		consumable: false,
	},
	{
		id: "priority_support",
		name: "Priority Support",
		type: "boolean",
	},
];

export const plans: Plan[] = [
	{
		id: "free",
		name: "Free",
		description: "One-time credit grant for trying Railway",
		features: [
			{ feature_id: "credits", included: 500 }, // One-time grant
			{
				feature_id: "memory_gb_hours",
				reset: { interval: "month" },
				price: { amount: 0.039, billing_method: "usage_based", billing_units: 1 },
			},
			{
				feature_id: "cpu_vcpu_hours",
				reset: { interval: "month" },
				price: { amount: 0.078, billing_method: "usage_based", billing_units: 1 },
			},
			{
				feature_id: "egress_gb",
				reset: { interval: "month" },
				price: { amount: 5, billing_method: "usage_based", billing_units: 1 },
			},
			{
				feature_id: "storage_gb",
				reset: { interval: "month" },
				price: { amount: 1.5, billing_method: "usage_based", billing_units: 1 },
			},
		],
	},
	{
		id: "hobby",
		name: "Hobby",
		description: "For hobbyists and small projects",
		price: { amount: 5, interval: "month" },
		features: [
			{ feature_id: "credits", included: 500, reset: { interval: "month" } },
			{
				feature_id: "memory_gb_hours",
				reset: { interval: "month" },
				price: { amount: 0.039, billing_method: "usage_based", billing_units: 1 },
			},
			{
				feature_id: "cpu_vcpu_hours",
				reset: { interval: "month" },
				price: { amount: 0.078, billing_method: "usage_based", billing_units: 1 },
			},
			{
				feature_id: "egress_gb",
				reset: { interval: "month" },
				price: { amount: 5, billing_method: "usage_based", billing_units: 1 },
			},
			{
				feature_id: "storage_gb",
				reset: { interval: "month" },
				price: { amount: 1.5, billing_method: "usage_based", billing_units: 1 },
			},
		],
	},
	{
		id: "pro",
		name: "Pro",
		description: "For teams and production workloads",
		price: { amount: 20, interval: "month" },
		features: [
			{ feature_id: "credits", included: 2000, reset: { interval: "month" } },
			{
				feature_id: "memory_gb_hours",
				reset: { interval: "month" },
				price: { amount: 0.039, billing_method: "usage_based", billing_units: 1 },
			},
			{
				feature_id: "cpu_vcpu_hours",
				reset: { interval: "month" },
				price: { amount: 0.078, billing_method: "usage_based", billing_units: 1 },
			},
			{
				feature_id: "egress_gb",
				reset: { interval: "month" },
				price: { amount: 5, billing_method: "usage_based", billing_units: 1 },
			},
			{
				feature_id: "storage_gb",
				reset: { interval: "month" },
				price: { amount: 1.5, billing_method: "usage_based", billing_units: 1 },
			},
			{ feature_id: "team_members", included: 5 },
			{ feature_id: "priority_support" },
		],
	},
];
