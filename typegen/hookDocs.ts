/**
 * Centralized hook documentation definitions.
 * These generate JSDoc comments for React hooks in autumn-js.
 */

interface HookJSDocParameter {
	name: string;
	type: string;
	description: string;
	required?: boolean;
}

interface HookJSDocReturn {
	name: string;
	type: string;
	description: string;
}

interface HookJSDocOptions {
	name: string;
	description: string;
	whenToUse?: string;
	parameters: HookJSDocParameter[];
	returns: HookJSDocReturn[];
	docsUrl: string;
}

/**
 * Generate JSDoc comment for a React hook
 */
export function createHookJSDoc(options: HookJSDocOptions): string {
	const parts: string[] = [];

	// Main description
	parts.push(options.description);

	// When to use section
	if (options.whenToUse) {
		parts.push("");
		parts.push(options.whenToUse);
	}

	// Parameters
	if (options.parameters.length > 0) {
		parts.push("");
		for (const param of options.parameters) {
			const requiredTag = param.required ? "" : " (optional)";
			parts.push(`@param ${param.name} - ${param.description}${requiredTag}`);
		}
	}

	// Returns
	if (options.returns.length > 0) {
		parts.push("");
		for (const ret of options.returns) {
			parts.push(`@returns ${ret.name} - ${ret.description}`);
		}
	}

	// Documentation link
	if (options.docsUrl) {
		parts.push("");
		parts.push(`@see {@link ${options.docsUrl}}`);
	}

	return parts.join("\n");
}

/**
 * Hook documentation for useCustomer
 * Seeded from: autumn-docs/api-reference/hooks/useCustomer.mdx
 */
export const useCustomerHookDoc = createHookJSDoc({
	name: "useCustomer",
	description:
		"Access a customer's state and use it to display information in your React app.\n\nThe `useCustomer` hook provides access to customer data and related operations. You can use it from your frontend to retrieve customer information, manage loading states, and create entities.",
	parameters: [
		{
			name: "params.expand",
			type: "CustomerExpandOption[]",
			description:
				"Additional data to include (invoices, rewards, trials_used, entities, referrals, payment_method)",
		},
		{
			name: "params.errorOnNotFound",
			type: "boolean",
			description: "Whether to throw error if customer not found",
		},
		{
			name: "params.swrConfig",
			type: "SWRConfiguration",
			description: "SWR configuration options",
		},
	],
	returns: [
		{
			name: "data",
			type: "Autumn.Customer | null",
			description: "Customer object with subscription and feature data",
		},
		{
			name: "isLoading",
			type: "boolean",
			description: "Whether customer data is being fetched",
		},
		{
			name: "error",
			type: "AutumnError | null",
			description: "Any error that occurred while fetching",
		},
		{
			name: "refetch",
			type: "() => Promise<Autumn.Customer | null>",
			description: "Refetch customer data",
		},
		{
			name: "...methods",
			type: "UseCustomerMethods",
			description:
				"All subscription methods (attach, checkout, cancel, track, setupPayment, openBillingPortal, createReferralCode, redeemReferralCode)",
		},
		{
			name: "createEntity",
			type: "(params: EntityCreateParams) => Promise<Autumn.Entity>",
			description: "Create entities for granular feature tracking",
		},
	],
	docsUrl: "https://docs.useautumn.com/api-reference/hooks/useCustomer",
});

/**
 * Hook documentation for useEntity
 * Seeded from: autumn-docs/api-reference/hooks/useEntity.mdx
 */
export const useEntityHookDoc = createHookJSDoc({
	name: "useEntity",
	description:
		"Access an entity's state and use it to display information in your React app.\n\nThe `useEntity` hook provides access to entity data and related operations. You can use it from your frontend to retrieve entity information and manage loading states.",
	parameters: [
		{
			name: "entityId",
			type: "string | null",
			description: "The ID of the entity to retrieve",
			required: true,
		},
		{
			name: "params.expand",
			type: "'invoices'[]",
			description: "Additional data to include in entity response",
		},
	],
	returns: [
		{
			name: "data",
			type: "Autumn.Entity | null",
			description: "Entity object with subscription and feature data",
		},
		{
			name: "isLoading",
			type: "boolean",
			description: "Whether entity data is being fetched",
		},
		{
			name: "error",
			type: "AutumnError | null",
			description: "Any error that occurred while fetching",
		},
		{
			name: "refetch",
			type: "() => Promise<Autumn.Entity | null>",
			description: "Refetch entity data",
		},
		{
			name: "...methods",
			type: "Subset<UseCustomerMethods>",
			description: "Entity-scoped methods (attach, cancel, track, check)",
		},
	],
	docsUrl: "https://docs.useautumn.com/api-reference/hooks/useEntity",
});

/**
 * Hook documentation for useAnalytics
 * Seeded from: autumn-docs/api-reference/hooks/useAnalytics.mdx
 */
export const useAnalyticsHookDoc = createHookJSDoc({
	name: "useAnalytics",
	description:
		"Query usage analytics data from your React components.\n\nThe `useAnalytics` hook provides access to usage analytics and reporting data. It's the client-side equivalent of the `/query` endpoint, allowing you to fetch and display usage data directly in your React components.",
	parameters: [
		{
			name: "params.featureId",
			type: "string | string[]",
			description: "Feature ID(s) to query usage data for",
			required: true,
		},
		{
			name: "params.range",
			type: "'24h' | '7d' | '30d' | '90d' | 'last_cycle'",
			description: "Time range for analytics query. Defaults to '30d'",
		},
	],
	returns: [
		{
			name: "data",
			type: "QueryResponse['list']",
			description:
				"Array of usage data points with period timestamps and feature usage counts",
		},
		{
			name: "isLoading",
			type: "boolean",
			description: "Whether analytics data is being fetched",
		},
		{
			name: "error",
			type: "AutumnError | null",
			description: "Any error that occurred while fetching",
		},
		{
			name: "refetch",
			type: "() => Promise<void>",
			description: "Manually refetch analytics data",
		},
	],
	docsUrl: "https://docs.useautumn.com/api-reference/hooks/useAnalytics",
});
