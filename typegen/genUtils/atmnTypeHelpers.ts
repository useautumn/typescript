/**
 * Generic helpers for generating TypeScript types with JSDoc from meta descriptions
 * Can be reused for any entity type (Plans, Features, Referrals, etc.)
 */

/**
 * Configuration for a field in a TypeScript type
 */
export interface FieldConfig {
	name: string;
	type: string;
	optional?: boolean;
	descriptionKey?: string; // Key to look up in metaDescriptions
	defaultDescription?: string; // Fallback if not found in meta
	nestedFields?: FieldConfig[]; // For nested objects
}

/**
 * Configuration for a discriminated union variant
 */
export interface DiscriminatedVariantConfig {
	name: string;
	description?: string;
	fields: FieldConfig[];
}

/**
 * Generate a TypeScript type with per-field JSDoc
 */
export function generateTypeWithJSDoc({
	typeName,
	fields,
	metaDescriptions,
	comment,
}: {
	typeName: string;
	fields: FieldConfig[];
	metaDescriptions: Record<string, string>;
	comment?: string;
}): string {
	const generateFields = (
		fields: FieldConfig[],
		indent: string = "  ",
	): string => {
		return fields
			.map((field) => {
				const description = field.descriptionKey
					? metaDescriptions[field.descriptionKey] || field.defaultDescription
					: field.defaultDescription;

				let result = "";

				// Add JSDoc if we have a description
				if (description) {
					result += `${indent}/** ${description} */\n`;
				}

				// Handle nested objects
				if (field.nestedFields) {
					result += `${indent}${field.name}${field.optional ? "?" : ""}: {\n`;
					result += generateFields(field.nestedFields, indent + "  ");
					result += `${indent}}`;
				} else {
					result += `${indent}${field.name}${field.optional ? "?" : ""}: ${field.type};`;
				}

				return result;
			})
			.join("\n\n");
	};

	let result = "";
	if (comment) {
		result += `/**\n * ${comment}\n */\n`;
	}
	result += `export type ${typeName} = {\n`;
	result += generateFields(fields);
	result += `\n};\n`;

	return result;
}

/**
 * Generate a discriminated union with per-field JSDoc
 */
export function generateDiscriminatedUnion({
	baseTypeName,
	unionTypeName,
	variants,
	metaDescriptions,
	typeAliases,
	comment,
}: {
	baseTypeName?: string;
	unionTypeName: string;
	variants: DiscriminatedVariantConfig[];
	metaDescriptions: Record<string, string>;
	typeAliases?: Record<string, string>; // e.g., { ResetInterval: "one_off" | "minute" | ... }
	comment?: string;
}): string {
	let result = "";

	// Add type aliases if provided
	if (typeAliases) {
		result += "// Type aliases for literal unions\n";
		for (const [name, union] of Object.entries(typeAliases)) {
			result += `export type ${name} = ${union};\n`;
		}
		result += "\n";
	}

	// Add base type reference if needed
	if (baseTypeName) {
		result += `// Base type for ${unionTypeName}\n`;
		result += `type ${baseTypeName}Base = z.infer<typeof ${baseTypeName}Schema>;\n\n`;
	}

	// Generate each variant
	for (const variant of variants) {
		result += generateTypeWithJSDoc({
			typeName: variant.name,
			fields: variant.fields,
			metaDescriptions,
			comment: variant.description,
		});
		result += "\n";
	}

	// Generate the union
	if (comment) {
		result += `/**\n * ${comment}\n */\n`;
	}
	result += `export type ${unionTypeName} = ${variants.map((v) => v.name).join(" | ")};\n`;

	return result;
}

/**
 * Generate PlanFeature discriminated union type
 * 
 * SDK structure uses mutually exclusive reset patterns:
 * - PlanFeatureWithReset: Top-level reset (for free allocations or non-priced features)
 * - PlanFeatureWithPriceReset: Nested price.reset (for usage-based pricing)
 * - PlanFeatureNoReset: No reset at all (for continuous-use features like seats)
 */
export function generatePlanFeatureType(
	_metaDescriptions: Record<string, string>,
): string {
	const typeAliases = {
		ResetInterval:
			'"one_off" | "hour" | "day" | "week" | "month" | "quarter" | "year"',
		RolloverExpiryDurationType: '"month" | "forever"',
		BillingInterval: '"month" | "quarter" | "semi_annual" | "year"',
		BillingMethod: '"prepaid" | "usage_based"',
		OnIncrease: '"prorate" | "charge_immediately"',
		OnDecrease: '"prorate" | "refund_immediately" | "no_action"',
	};

	let result = "";

	// Add type aliases
	result += "// Type aliases for literal unions\n";
	for (const [name, union] of Object.entries(typeAliases)) {
		result += `export type ${name} = ${union};\n`;
	}
	result += "\n";

	// Add base type reference
	result += "// Base type for PlanFeature\n";
	result += "type PlanFeatureBase = z.infer<typeof PlanFeatureSchema>;\n\n";

	// Generate the discriminated union manually for precise control
	result += `// Reset configuration object (for top-level reset)
type ResetConfig = {
  /** How often usage resets (e.g., 'month', 'day') */
  interval: ResetInterval;
  /** Number of intervals between resets (default: 1) */
  interval_count?: number;
};

// Proration configuration
type ProrationConfig = {
  /** Behavior when quantity increases */
  on_increase: OnIncrease;
  /** Behavior when quantity decreases */
  on_decrease: OnDecrease;
};

// Rollover configuration
type RolloverConfig = {
  /** Maximum amount that can roll over (null for unlimited) */
  max: number | null;
  /** How long rollover lasts before expiring */
  expiry_duration_type: RolloverExpiryDurationType;
  /** Duration length for rollover expiry */
  expiry_duration_length?: number;
};

// Base fields shared by all PlanFeature variants
type PlanFeatureBaseFields = {
  /** Reference to the feature being configured */
  feature_id: string;
  /** Amount of usage included in this plan */
  included?: number;
  /** Whether usage is unlimited */
  unlimited?: boolean;
  /** Proration rules for quantity changes */
  proration?: ProrationConfig;
  /** Rollover policy for unused usage */
  rollover?: RolloverConfig;
};

// Price object without interval (used with top-level reset)
type PriceWithoutInterval = {
  /** Flat price per unit */
  amount?: number;
  /** Tiered pricing structure based on usage ranges */
  tiers?: Array<{ to: number | "inf"; amount: number }>;
  /** Number of units per billing cycle */
  billing_units?: number;
  /** Billing method: 'prepaid' or 'usage_based' */
  billing_method: BillingMethod;
  /** Maximum purchasable quantity */
  max_purchase?: number;
  /** Cannot have price.interval when using top-level reset */
  interval?: never;
  interval_count?: never;
};

// Price object with interval (billing cycle configuration)
type PriceWithInterval = {
  /** Flat price per unit */
  amount?: number;
  /** Tiered pricing structure based on usage ranges */
  tiers?: Array<{ to: number | "inf"; amount: number }>;
  /** Number of units per billing cycle */
  billing_units?: number;
  /** Billing method: 'prepaid' or 'usage_based' */
  billing_method: BillingMethod;
  /** Maximum purchasable quantity */
  max_purchase?: number;
  /** Billing interval (e.g., 'month', 'day') */
  interval: ResetInterval;
  /** Number of intervals between billing cycles (default: 1) */
  interval_count?: number;
};

/**
 * Plan feature with top-level reset configuration.
 * Use this for free allocations or features that reset but aren't priced per-use.
 */
export type PlanFeatureWithReset = PlanFeatureBaseFields & {
  /** Reset configuration for usage limits */
  reset: ResetConfig;
  /** Optional pricing (cannot have price.interval when using top-level reset) */
  price?: PriceWithoutInterval;
};

/**
 * Plan feature with pricing that includes interval configuration.
 * Use this for usage-based pricing where interval determines billing cycle.
 */
export type PlanFeatureWithPriceInterval = PlanFeatureBaseFields & {
  /** Cannot have top-level reset when using price.interval */
  reset?: never;
  /** Pricing configuration with billing interval */
  price: PriceWithInterval;
};

/**
 * Plan feature without any reset configuration.
 * Use this for continuous-use features (like seats) that don't reset.
 */
export type PlanFeatureNoReset = PlanFeatureBaseFields & {
  /** No reset for continuous-use features */
  reset?: never;
  /** Optional pricing without interval */
  price?: PriceWithoutInterval;
};

/**
 * Plan feature configuration with mutually exclusive reset patterns:
 * - PlanFeatureWithReset: Top-level reset (for free allocations)
 * - PlanFeatureWithPriceInterval: price.interval (for usage-based pricing billing cycle)
 * - PlanFeatureNoReset: No reset (for continuous-use features like seats)
 */
export type PlanFeature = PlanFeatureWithReset | PlanFeatureWithPriceInterval | PlanFeatureNoReset;
`;

	return result;
}

/**
 * Generate Plan type with JSDoc from meta descriptions (using generic helpers)
 */
export function generatePlanTypeWithJSDoc(
	metaDescriptions: Record<string, string>,
): string {
	let result = "";

	// Add base type reference
	result += "\n// Override Plan type to use PlanFeature discriminated union\n";
	result += "type PlanBase = z.infer<typeof PlanSchema>;\n";
	result += "export type FreeTrial = z.infer<typeof FreeTrialSchema>;\n\n";

	// Generate Plan type with JSDoc
	const planFields: FieldConfig[] = [
		{
			name: "id",
			type: "string",
			descriptionKey: "id",
			defaultDescription: "Unique identifier for the plan",
		},
		{
			name: "name",
			type: "string",
			descriptionKey: "name",
			defaultDescription: "Display name for the plan",
		},
		{
			name: "description",
			type: "string | null",
			optional: true,
			descriptionKey: "description",
			defaultDescription:
				"Optional description explaining what this plan offers",
		},
		{
			name: "group",
			type: "string",
			optional: true,
			descriptionKey: "group",
			defaultDescription: "Grouping identifier for organizing related plans",
		},
		{
			name: "add_on",
			type: "boolean",
			optional: true,
			descriptionKey: "add_on",
			defaultDescription:
				"Whether this plan can be purchased alongside other plans",
		},
		{
			name: "auto_enable",
			type: "boolean",
			optional: true,
			descriptionKey: "auto_enable",
			defaultDescription: "Whether to automatically enable this plan for new customers",
		},
		{
			name: "price",
			type: "object",
			optional: true,
			descriptionKey: "price",
			defaultDescription: "Base price for the plan",
			nestedFields: [
				{
					name: "amount",
					type: "number",
					descriptionKey: "price.amount",
					defaultDescription: "Price in your currency (e.g., 50 for $50.00)",
				},
			{
				name: "interval",
				type: "BillingInterval | ResetInterval",
				descriptionKey: "price.interval",
				defaultDescription: "Billing frequency",
			},
			],
		},
		{
			name: "features",
			type: "PlanFeature[]",
			optional: true,
			descriptionKey: "features",
			defaultDescription: "Features included with usage limits and pricing",
		},
		{
			name: "free_trial",
			type: "FreeTrial | null",
			optional: true,
			descriptionKey: "free_trial",
			defaultDescription: "Free trial period before billing begins",
		},
	];

	result += generateTypeWithJSDoc({
		typeName: "Plan",
		fields: planFields,
		metaDescriptions,
	});

	return result;
}

/**
 * Generate Feature discriminated union type
 * - boolean features cannot have consumable: true
 * - metered features require consumable field
 * - credit_system features are always consumable
 */
export function generateFeatureDiscriminatedUnion(): string {
	return `
// Base fields shared by all feature types
type FeatureBase = {
  /** Unique identifier for the feature */
  id: string;
  /** Display name for the feature */
  name: string;
  /** Event names that trigger this feature */
  event_names?: string[];
  /** Credit schema for credit_system features */
  credit_schema?: Array<{
    metered_feature_id: string;
    credit_cost: number;
  }>;
};

/** Boolean feature - no consumable field allowed */
export type BooleanFeature = FeatureBase & {
  type: "boolean";
  consumable?: never;
};

/** Metered feature - requires consumable field */
export type MeteredFeature = FeatureBase & {
  type: "metered";
  /** Whether usage is consumed (true) or accumulated (false) */
  consumable: boolean;
};

/** Credit system feature - always consumable */
export type CreditSystemFeature = FeatureBase & {
  type: "credit_system";
  /** Credit systems are always consumable */
  consumable?: true;
  /** Required: defines how credits map to metered features */
  credit_schema: Array<{
    metered_feature_id: string;
    credit_cost: number;
  }>;
};

/**
 * Feature definition with type-safe constraints:
 * - Boolean features cannot have consumable
 * - Metered features require consumable (true = single_use style, false = continuous_use style)
 * - Credit system features are always consumable and require credit_schema
 */
export type Feature = BooleanFeature | MeteredFeature | CreditSystemFeature;
`;
}
