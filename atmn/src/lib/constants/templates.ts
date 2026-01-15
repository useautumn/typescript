/**
 * Template data for the template selector
 * Each template has 3 pricing plans with features
 */

export interface PlanData {
	name: string;
	features: string[];
	price: string;
	badge?: string;
}

export const templateData: Record<string, PlanData[]> = {
	Blacktriangle: [
		{
			name: "Hobby",
			features: [
				"100 GB bandwidth",
				"Serverless functions",
				"Edge network",
				"Community support",
			],
			price: "$0/month",
		},
		{
			name: "Pro",
			badge: "most popular",
			features: [
				"1 TB bandwidth",
				"Advanced analytics",
				"Team collaboration",
				"Preview deployments",
				"Priority support",
				"Custom domains",
				"DDoS protection",
			],
			price: "$20/month",
		},
		{
			name: "Enterprise",
			features: [
				"Unlimited bandwidth",
				"SLA guarantee",
				"Dedicated support",
				"SSO & SAML",
				"Custom contracts",
			],
			price: "Custom",
		},
	],
	RatGPT: [
		{
			name: "Free",
			features: [
				"50 messages/day",
				"Basic AI model",
				"Web access",
				"Standard speed",
			],
			price: "$0/month",
		},
		{
			name: "Plus",
			badge: "most popular",
			features: [
				"Unlimited messages",
				"Advanced AI models",
				"Priority access",
				"Plugins & tools",
				"Image generation",
				"Voice mode",
				"File uploads",
			],
			price: "$20/month",
		},
		{
			name: "Team",
			features: [
				"All Plus features",
				"Admin console",
				"Team workspace",
				"Usage analytics",
				"Priority support",
			],
			price: "$25/user/mo",
		},
	],
	Aksiom: [
		{
			name: "Starter",
			features: [
				"1 GB ingest/mo",
				"7 day retention",
				"Basic dashboards",
				"Email alerts",
			],
			price: "$0/month",
		},
		{
			name: "Pro",
			badge: "most popular",
			features: [
				"50 GB ingest/mo",
				"30 day retention",
				"Advanced queries",
				"Team access",
				"Slack alerts",
				"API access",
				"Custom dashboards",
			],
			price: "$25/month",
		},
		{
			name: "Enterprise",
			features: [
				"Unlimited ingest",
				"90 day retention",
				"SSO & RBAC",
				"Dedicated support",
				"SLA guarantee",
			],
			price: "Custom",
		},
	],
};

export const templates = ["Blacktriangle", "RatGPT", "Aksiom"] as const;

export type TemplateName = (typeof templates)[number];
