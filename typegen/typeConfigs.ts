import path from "path";

/**
 * Configuration for a single method to generate
 */
export interface MethodConfig {
	/** SDK method name (e.g., "attach") */
	sourceName: string;
	/** Client method name (e.g., "attach" or "openBillingPortal") */
	targetName: string;
	/** Whether this method returns synchronously (not a Promise) in the client */
	isSync?: boolean;
	/** @param tags to exclude from JSDoc (e.g., ["body.customer_id"]) */
	exclusions?: string[];
}

/**
 * Configuration for method generation
 */
export interface MethodGenerationConfig {
	/** Source file path (SDK client.ts) */
	sourceFile: string;
	/** Target output file path */
	targetFile: string;
	/** List of methods to extract and generate */
	methods: MethodConfig[];
	/** Interface name (e.g., "UseCustomerMethods", "UseEntityMethods") */
	interfaceName?: string;
	/** Interface description */
	interfaceDescription?: string;
}

/**
 * Configuration for a single hook to document
 */
export interface HookConfig {
	/** Hook name (e.g., "useCustomer") */
	name: string;
	/** File path to the hook */
	filePath: string;
	/** JSDoc content from hookDocs.ts */
	jsdoc: string;
	/** Function name to document (e.g., "useCustomerBase") */
	exportName: string;
}

/**
 * Configuration for hook documentation generation
 */
export interface HookGenerationConfig {
	/** List of hooks to document */
	hooks: HookConfig[];
}

/**
 * Configuration for individual type generation
 */
export interface TypeConfig {
	/** Snake case type name from @ts-sdk */
	sourceName: string;
	/** Camel case type name for autumn-js */
	targetName: string;
	/** Source file path in @ts-sdk */
	sourceFile: string;
	/** Target file path in autumn-js */
	targetFile: string;
	/** Fields to omit from the generated schema */
	omitFields?: string[];
	/** Additional fields to extend the schema with (field name -> Zod schema) */
	extendFields?: Record<string, { zodType: string; description?: string }>;
	/** Source type: "interface" (TypeScript interface) or "zod" (Zod schema) */
	sourceType?: "interface" | "zod";
	/** Whether to keep snake_case (true) or convert to camelCase (false). Default: false for autumn-js, true for atmn */
	keepCase?: boolean;
	/** Fields to rename (oldName -> newName) */
	renameFields?: Record<string, string>;
	/** Replace all enum references with z.string() */
	replaceEnumsWithStrings?: boolean;
	/** Skip exporting the TypeScript type (useful when manually defining discriminated unions) */
	skipTypeExport?: boolean;
}

/**
 * Configuration for a builder function
 */
export interface BuilderConfig {
	/** Builder function name (e.g., "plan", "feature") */
	builderName: string;
	/** Schema name to reference (e.g., "PlanSchema") */
	schemaName: string;
	/** Parameter type name (e.g., "Plan", "Feature") */
	paramType: string;
	/** Source file to extract JSDoc from (optional) */
	sourceFile?: string;
	/** Target file to write builder to */
	targetFile: string;
	/** Whether to include runtime validation (.parse()) */
	validationEnabled?: boolean;
	/** Custom JSDoc override */
	jsdocOverride?: string;
	/** Default values for fields (undefined -> default value) */
	defaults?: Record<string, string | number | boolean | null>;
}

/**
 * Configuration for type generation including output directory
 */
export interface TypeGenerationConfig {
	/** Array of type configurations */
	configs: TypeConfig[];
	/** Relative path within target package for generated types */
	outputDir: string;
	/** Builder function configurations (optional) */
	builders?: BuilderConfig[];
	/** Manual type unions to append after generated types */
	manualTypeUnions?: Array<{
		targetFile: string;
		typeCode: string;
	}>;
}

/**
 * Type configurations for autumn-js generation
 *
 * This is the main configuration file that defines which types get converted
 * from snake_case (@ts-sdk) to camelCase (autumn-js).
 *
 * Add new type conversions here to extend the generation pipeline.
 */
export function getAutumnJSTypeConfigs(
	tsSDKPath: string,
	autumnJSPath: string,
): TypeGenerationConfig {
	const topLevelFile = path.join(tsSDKPath, "src/resources/top-level.ts");
	const sharedFile = path.join(tsSDKPath, "src/resources/shared.ts");
	const customersFile = path.join(tsSDKPath, "src/resources/customers.ts");
	const entitiesFile = path.join(tsSDKPath, "src/resources/entities.ts");
	const referralsFile = path.join(tsSDKPath, "src/resources/referrals.ts");

	// Output directory configuration - change this to modify where types are generated
	const outputDir = "src/libraries/react/clientTypes";
	const generatedDir = path.join(autumnJSPath, outputDir);

	return {
		outputDir,
		configs: [
			// Shared/common types (used across multiple schemas)
			{
				sourceName: "CustomerData",
				targetName: "CustomerData",
				sourceFile: sharedFile,
				targetFile: path.join(generatedDir, "customerDataTypes.ts"),
			},
			{
				sourceName: "EntityData",
				targetName: "EntityData",
				sourceFile: sharedFile,
				targetFile: path.join(generatedDir, "entityDataTypes.ts"),
			},

			// Customer management types
			{
				sourceName: "CustomerCreateParams",
				targetName: "CreateCustomerParams",
				sourceFile: customersFile,
				targetFile: path.join(generatedDir, "createCustomerTypes.ts"),
				omitFields: ["id"], // Omit "id" field as mentioned in your usage
				extendFields: {
					errorOnNotFound: {
						zodType: "z.boolean().optional()",
						description: "Whether to return an error if customer is not found",
					},
				},
			},

			// Entity management types
			{
				sourceName: "EntityCreateParams",
				targetName: "CreateEntityParams",
				sourceFile: entitiesFile,
				targetFile: path.join(generatedDir, "createEntityTypes.ts"),
				// No omitFields needed - EntityCreateParams doesn't have customer_id
			},
			{
				sourceName: "EntityGetParams",
				targetName: "GetEntityParams",
				sourceFile: entitiesFile,
				targetFile: path.join(generatedDir, "getEntityTypes.ts"),
				omitFields: ["customer_id"], // Remove customerId - handled by client
			},

			// Referral management types
			{
				sourceName: "ReferralCreateCodeParams",
				targetName: "CreateReferralCodeParams",
				sourceFile: referralsFile,
				targetFile: path.join(generatedDir, "createReferralCodeTypes.ts"),
				omitFields: ["customer_id"], // Remove customerId - handled by client
			},
			{
				sourceName: "ReferralRedeemCodeParams",
				targetName: "RedeemReferralCodeParams",
				sourceFile: referralsFile,
				targetFile: path.join(generatedDir, "redeemReferralCodeTypes.ts"),
				omitFields: ["customer_id"], // Remove customerId - handled by client
			},

			// Core attachment flow types
			{
				sourceName: "AttachParams",
				targetName: "AttachParams",
				sourceFile: topLevelFile,
				targetFile: path.join(generatedDir, "attachTypes.ts"),
				omitFields: ["customer_id"], // Remove customerId - handled by client
				extendFields: {
					dialog: {
						zodType: "z.any().optional()",
						description:
							"DEPRECATED: This field is deprecated and will be removed in a future version. Please use the checkout() method instead.",
					},
					openInNewTab: {
						zodType: "z.boolean().optional()",
						description: "Whether to open checkout in a new tab",
					},
					metadata: {
						zodType: "z.record(z.string(), z.string()).optional()",
						description: "Additional metadata for the request",
					},
				},
			},
			{
				sourceName: "CheckoutParams",
				targetName: "CheckoutParams",
				sourceFile: topLevelFile,
				targetFile: path.join(generatedDir, "checkoutTypes.ts"),
				omitFields: ["customer_id"], // Remove customerId - handled by client
				extendFields: {
					dialog: {
						zodType: "z.any().optional()",
						description: "Dialog configuration for checkout flow",
					},
					openInNewTab: {
						zodType: "z.boolean().optional()",
						description: "Whether to open checkout in a new tab",
					},
				},
			},

			// Billing and payment types
			{
				sourceName: "BillingPortalParams",
				targetName: "OpenBillingPortalParams",
				sourceFile: topLevelFile,
				targetFile: path.join(generatedDir, "billingPortalTypes.ts"),
				omitFields: ["customer_id"], // Remove customerId - handled by client
				extendFields: {
					openInNewTab: {
						zodType: "z.boolean().optional()",
						description: "Whether to open billing portal in a new tab",
					},
				},
			},
			{
				sourceName: "SetupPaymentParams",
				targetName: "SetupPaymentParams",
				sourceFile: topLevelFile,
				targetFile: path.join(generatedDir, "setupPaymentTypes.ts"),
				omitFields: ["customer_id"], // Remove customerId - handled by client
				extendFields: {
					openInNewTab: {
						zodType: "z.boolean().optional()",
						description: "Whether to open payment setup in a new tab",
					},
				},
			},

			// Product management types
			{
				sourceName: "CancelParams",
				targetName: "CancelParams",
				sourceFile: topLevelFile,
				targetFile: path.join(generatedDir, "cancelTypes.ts"),
				omitFields: ["customer_id"], // Remove customerId - handled by client
			},

			// Usage and analytics types
			{
				sourceName: "CheckParams",
				targetName: "CheckParams",
				sourceFile: topLevelFile,
				targetFile: path.join(generatedDir, "checkTypes.ts"),
				omitFields: ["customer_id"], // Remove customerId - handled by client
				extendFields: {
					dialog: {
						zodType: "z.any().optional()",
						description: "Dialog configuration for feature check flow",
					},
					properties: {
						zodType: "z.record(z.string(), z.any()).optional()",
						description: "Additional properties for the feature check",
					},
				},
			},
			{
				sourceName: "TrackParams",
				targetName: "TrackParams",
				sourceFile: topLevelFile,
				targetFile: path.join(generatedDir, "trackTypes.ts"),
				omitFields: ["customer_id"], // Remove customerId - handled by client
			},
			{
				sourceName: "QueryParams",
				targetName: "QueryParams",
				sourceFile: topLevelFile,
				targetFile: path.join(generatedDir, "queryTypes.ts"),
				omitFields: ["customer_id"], // Remove customerId - handled by client
			},
		],
	};
}

/**
 * Method configurations for autumn-js hooks (UseCustomer + UseEntity)
 * Extracts method signatures and JSDoc from SDK client.ts
 */
export function getAutumnJSMethodConfigs(
	tsSDKPath: string,
	autumnJSPath: string,
): MethodGenerationConfig[] {
	const clientFile = path.join(tsSDKPath, "src/client.ts");

	return [
		// UseCustomer methods
		{
			sourceFile: clientFile,
			targetFile: path.join(
				autumnJSPath,
				"src/libraries/react/hooks/types/useCustomerMethods.ts",
			),
			interfaceName: "UseCustomerMethods",
			interfaceDescription:
				"Methods available in useCustomer hook for managing customer subscriptions and features",
			methods: [
				{
					sourceName: "attach",
					targetName: "attach",
					exclusions: ["body.customer_id"],
				},
				{
					sourceName: "checkout",
					targetName: "checkout",
					exclusions: ["body.customer_id"],
				},
				{
					sourceName: "check",
					targetName: "check",
					isSync: true,
					exclusions: ["body.customer_id"],
				},
				{
					sourceName: "track",
					targetName: "track",
					exclusions: ["body.customer_id"],
				},
				{
					sourceName: "cancel",
					targetName: "cancel",
					exclusions: ["body.customer_id"],
				},
				{
					sourceName: "setupPayment",
					targetName: "setupPayment",
					exclusions: ["body.customer_id"],
				},
				{
					sourceName: "billingPortal",
					targetName: "openBillingPortal",
					exclusions: ["body.customer_id"],
				},
			],
		},
		// UseEntity methods
		{
			sourceFile: clientFile,
			targetFile: path.join(
				autumnJSPath,
				"src/libraries/react/hooks/types/useEntityMethods.ts",
			),
			interfaceName: "UseEntityMethods",
			interfaceDescription:
				"Methods available in useEntity hook for entity-scoped subscription operations",
			methods: [
				{
					sourceName: "attach",
					targetName: "attach",
					exclusions: ["body.customer_id"],
				},
				{
					sourceName: "cancel",
					targetName: "cancel",
					exclusions: ["body.customer_id"],
				},
				{
					sourceName: "track",
					targetName: "track",
					exclusions: ["body.customer_id"],
				},
				{
					sourceName: "check",
					targetName: "check",
					isSync: true,
					exclusions: ["body.customer_id"],
				},
			],
		},
	];
}

/**
 * Hook documentation configurations for autumn-js
 * Injects JSDoc into React hook files from hookDocs.ts
 */
export function getAutumnJSHookConfigs(
	autumnJSPath: string,
): HookGenerationConfig {
	// Import hook docs (will be available at runtime)
	const {
		useCustomerHookDoc,
		useEntityHookDoc,
		useAnalyticsHookDoc,
	} = require("./hookDocs.js");

	return {
		hooks: [
			{
				name: "useCustomer",
				filePath: path.join(
					autumnJSPath,
					"src/libraries/react/hooks/useCustomerBase.tsx",
				),
				jsdoc: useCustomerHookDoc,
				exportName: "useCustomerBase",
			},
			{
				name: "useEntity",
				filePath: path.join(
					autumnJSPath,
					"src/libraries/react/hooks/useEntity.tsx",
				),
				jsdoc: useEntityHookDoc,
				exportName: "useEntity",
			},
			{
				name: "useAnalytics",
				filePath: path.join(
					autumnJSPath,
					"src/libraries/react/hooks/useAnalytics.tsx",
				),
				jsdoc: useAnalyticsHookDoc,
				exportName: "useAnalytics",
			},
		],
	};
}

/**
 * Type configurations for @useautumn/convex generation
 * TODO: Implement when ready to generate Convex types
 */
export function getConvexTypeConfigs(
	_tsSDKPath: string,
	_convexPath: string,
): TypeConfig[] {
	// Placeholder for future Convex type generation
	return [];
}

/**
 * Type configurations for atmn CLI generation
 * Generates Plan V2 API types from @autumn/shared schemas
 */
export function getAtmnTypeConfigs(
	serverPath: string, // Path to @autumn/shared
	atmnPath: string, // Path to atmn package
): TypeGenerationConfig {
	// Source files from @autumn/shared
	const planOpModelsFile = path.join(
		serverPath,
		"api/products/planOpModels.ts",
	);
	const planFeatureOpModelsFile = path.join(
		serverPath,
		"api/products/planFeature/planFeatureOpModels.ts",
	);
	const apiPlanFile = path.join(serverPath, "api/products/apiPlan.ts");
	const apiFeatureFile = path.join(serverPath, "api/features/apiFeature.ts");

	// Target directories in atmn
	const modelsDir = path.join(atmnPath, "source/compose/models");
	const buildersDir = path.join(atmnPath, "source/compose/builders");

	return {
		outputDir: "source/compose/models",
		configs: [
			// ==================
			// PLAN
			// ==================
			{
				sourceName: "CreatePlanParamsSchema",
				targetName: "Plan",
				sourceFile: planOpModelsFile,
				targetFile: path.join(modelsDir, "planModels.ts"),
				sourceType: "zod",
				keepCase: true, // Keep snake_case
				replaceEnumsWithStrings: true,
				skipTypeExport: true, // Override type manually to use PlanFeature union
				omitFields: ["version", "id", "name", "group"],
				extendFields: {
					id: {
						zodType: "z.string().nonempty().regex(idRegex)",
						description: "Unique identifier for the plan",
					},
					name: {
						zodType: "z.string().nonempty()",
						description: "Display name for the plan",
					},
					group: {
						zodType: 'z.string().default("")',
						description: "Group for organizing plans",
					},
				},
			},

			// ==================
			// PLAN FEATURE (features in a plan)
			// ==================
			{
				sourceName: "UpdatePlanFeatureSchema",
				targetName: "PlanFeature",
				sourceFile: planFeatureOpModelsFile,
				targetFile: path.join(modelsDir, "planModels.ts"),
				sourceType: "zod",
				keepCase: true,
				replaceEnumsWithStrings: true,
				omitFields: [],
				extendFields: {},
				skipTypeExport: true, // Don't export type - we'll add discriminated union manually
			},

			// ==================
			// FEATURE (reusable feature definitions)
			// ==================
			{
				sourceName: "ApiFeatureSchema",
				targetName: "Feature",
				sourceFile: apiFeatureFile,
				targetFile: path.join(modelsDir, "featureModels.ts"),
				sourceType: "zod",
				keepCase: true,
				omitFields: ["type", "display"],
				extendFields: {
					type: {
						zodType: "z.string()",
						description: "The type of the feature (boolean, single_use, continuous_use, credit_system)",
					},
				},
			},

			// ==================
			// FREE TRIAL
			// ==================
			{
				sourceName: "ApiFreeTrialV2Schema",
				targetName: "FreeTrial",
				sourceFile: apiPlanFile,
				targetFile: path.join(modelsDir, "planModels.ts"),
				sourceType: "zod",
				keepCase: true,
				replaceEnumsWithStrings: true,
				skipTypeExport: true, // Exported in manual unions
				omitFields: [],
				extendFields: {},
			},
		],

		// ==================
		// BUILDER FUNCTIONS
		// ==================
		builders: [
			{
				builderName: "plan",
				schemaName: "PlanSchema",
				paramType: "Plan",
				targetFile: path.join(buildersDir, "builderFunctions.ts"),
				defaults: {
					description: null,
					add_on: false,
					default: false,
					group: "",
				},
				jsdocOverride: `/**
 * Define a pricing plan in your Autumn configuration
 *
 * @param p - Plan configuration
 * @returns Plan object for use in autumn.config.ts
 *
 * @example
 * export const pro = plan({
 *   id: 'pro',
 *   name: 'Pro Plan',
 *   description: 'For growing teams',
 *   features: [
 *     planFeature({ feature_id: seats.id, granted: 10 }),
 *     planFeature({
 *       feature_id: messages.id,
 *       granted: 1000,
 *       reset: { interval: 'month' }
 *     })
 *   ],
 *   price: { amount: 50, interval: 'month' }
 * });
 */`,
			},
			{
				builderName: "feature",
				schemaName: "FeatureSchema",
				paramType: "Feature",
				targetFile: path.join(buildersDir, "builderFunctions.ts"),
				jsdocOverride: `/**
 * Define a feature that can be included in plans
 *
 * @param f - Feature configuration
 * @returns Feature object for use in autumn.config.ts
 *
 * @example
 * export const seats = feature({
 *   id: 'seats',
 *   name: 'Team Seats',
 *   type: 'continuous_use'
 * });
 */`,
			},
			{
				builderName: "planFeature",
				schemaName: "PlanFeatureSchema",
				paramType: "PlanFeature",
				targetFile: path.join(buildersDir, "builderFunctions.ts"),
				jsdocOverride: `/**
 * Include a feature in a plan with specific configuration
 *
 * @param config - Feature configuration for this plan
 * @returns PlanFeature for use in plan's features array
 *
 * @example
 * // Simple included usage
 * planFeature({
 *   feature_id: messages.id,
 *   granted: 1000,
 *   reset: { interval: 'month' }
 * })
 *
 * @example
 * // Priced feature with tiers
 * planFeature({
 *   feature_id: seats.id,
 *   granted: 5,
 *   price: {
 *     tiers: [
 *       { to: 10, amount: 10 },
 *       { to: 'inf', amount: 8 }
 *     ],
 *     interval: 'month',
 *     usage_model: 'pay_per_use'
 *   }
 * })
 */`,
			},
		],
	};
}
