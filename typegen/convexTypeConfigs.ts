import path from "path";

/**
 * Configuration for generating a single Convex validator
 */
export interface ConvexValidatorConfig {
	/** Source interface name from SDK (e.g., "TrackParams") */
	sourceName: string;
	/** Target validator name (e.g., "TrackArgs") */
	targetName: string;
	/** Path to source file containing the interface */
	sourceFile: string;
	/** Fields to exclude from validation (e.g., ["customer_id"]) */
	excludeFields: string[];
	/** Whether to convert snake_case to camelCase */
	camelCase: boolean;
}

/**
 * Get all Convex validator configurations
 *
 * This defines which SDK interfaces get converted to Convex validators
 * and how they should be transformed (field exclusions, camelCase, etc.)
 */
export function getConvexValidatorConfigs(
	tsSDKPath: string,
	convexPath: string
): ConvexValidatorConfig[] {
	const topLevelFile = path.join(tsSDKPath, "src/resources/top-level.ts");
	const sharedFile = path.join(tsSDKPath, "src/resources/shared.ts");
	const customersFile = path.join(tsSDKPath, "src/resources/customers.ts");
	const entitiesFile = path.join(tsSDKPath, "src/resources/entities.ts");
	const referralsFile = path.join(tsSDKPath, "src/resources/referrals.ts");

	return [
		// Common/shared types (used by multiple validators)
		{
			sourceName: "CustomerData",
			targetName: "CustomerDataConvex",
			sourceFile: sharedFile,
			excludeFields: [],
			camelCase: true,
		},

		// Core operation validators
		{
			sourceName: "TrackParams",
			targetName: "TrackArgs",
			sourceFile: topLevelFile,
			excludeFields: ["customer_id"],
			camelCase: true,
		},
		{
			sourceName: "UsageParams",
			targetName: "UsageArgs",
			sourceFile: topLevelFile,
			excludeFields: ["customer_id"],
			camelCase: true,
		},
		{
			sourceName: "CheckParams",
			targetName: "CheckArgs",
			sourceFile: topLevelFile,
			excludeFields: ["customer_id"],
			camelCase: true,
		},
		{
			sourceName: "AttachParams",
			targetName: "AttachArgs",
			sourceFile: topLevelFile,
			excludeFields: ["customer_id"],
			camelCase: true,
		},
		{
			sourceName: "CheckoutParams",
			targetName: "CheckoutArgs",
			sourceFile: topLevelFile,
			excludeFields: ["customer_id"],
			camelCase: true,
		},
		{
			sourceName: "CancelParams",
			targetName: "CancelArgs",
			sourceFile: topLevelFile,
			excludeFields: ["customer_id"],
			camelCase: true,
		},
		{
			sourceName: "QueryParams",
			targetName: "QueryArgs",
			sourceFile: topLevelFile,
			excludeFields: ["customer_id"],
			camelCase: true,
		},
		{
			sourceName: "SetupPaymentParams",
			targetName: "SetupPaymentArgs",
			sourceFile: topLevelFile,
			excludeFields: ["customer_id"],
			camelCase: true,
		},

		// Customer management validators
		{
			sourceName: "CustomerGetParams",
			targetName: "GetCustomerArgs",
			sourceFile: customersFile,
			excludeFields: ["customer_id"],
			camelCase: true,
		},
		{
			sourceName: "CustomerCreateParams",
			targetName: "CreateCustomerArgs",
			sourceFile: customersFile,
			excludeFields: [],
			camelCase: true,
		},
		{
			sourceName: "CustomerUpdateParams",
			targetName: "UpdateCustomerArgs",
			sourceFile: customersFile,
			excludeFields: ["customer_id"],
			camelCase: true,
		},
		{
			sourceName: "CustomerUpdateBalancesParams",
			targetName: "UpdateBalancesArgs",
			sourceFile: customersFile,
			excludeFields: ["customer_id"],
			camelCase: true,
		},
		{
			sourceName: "BillingPortalParams",
			targetName: "BillingPortalArgs",
			sourceFile: topLevelFile,
			excludeFields: ["customer_id"],
			camelCase: true,
		},

		// Entity management validators
		{
			sourceName: "EntityCreateParams",
			targetName: "CreateEntityArgs",
			sourceFile: entitiesFile,
			excludeFields: ["customer_id"],
			camelCase: true,
		},
		{
			sourceName: "EntityGetParams",
			targetName: "GetEntityArgs",
			sourceFile: entitiesFile,
			excludeFields: ["customer_id"],
			camelCase: true,
		},

		// Referral management validators
		{
			sourceName: "ReferralCreateCodeParams",
			targetName: "CreateReferralCodeArgs",
			sourceFile: referralsFile,
			excludeFields: ["customer_id"],
			camelCase: true,
		},
		{
			sourceName: "ReferralRedeemCodeParams",
			targetName: "RedeemReferralCodeArgs",
			sourceFile: referralsFile,
			excludeFields: ["customer_id"],
			camelCase: true,
		},

		// Misc validators
		{
			sourceName: "ProductListParams",
			targetName: "ListProductsArgs",
			sourceFile: path.join(tsSDKPath, "src/resources/products.ts"),
			excludeFields: ["customer_id"],
			camelCase: true,
		},
	];
}
