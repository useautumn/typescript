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
 * Generate PlanFeature discriminated union (using generic helpers)
 */
export function generatePlanFeatureDiscriminatedUnion(
	metaDescriptions: Record<string, string>,
): string {
	const typeAliases = {
		ResetInterval:
			'"one_off" | "minute" | "hour" | "day" | "week" | "month" | "quarter" | "year"',
		BillingInterval: '"month" | "quarter" | "semi_annual" | "year"',
		UsageModel: '"prepaid" | "pay_per_use"',
		OnIncrease: '"prorate" | "charge_immediately"',
		OnDecrease: '"prorate" | "refund_immediately" | "no_action"',
	};

	// Common fields for all variants
	const commonFields: FieldConfig[] = [
		{
			name: "feature_id",
			type: "string",
			descriptionKey: "feature_id",
			defaultDescription: "Reference to the feature being configured",
		},
		{
			name: "granted",
			type: "number",
			optional: true,
			descriptionKey: "granted",
			defaultDescription: "Amount of usage granted to customers",
		},
		{
			name: "unlimited",
			type: "boolean",
			optional: true,
			descriptionKey: "unlimited",
			defaultDescription: "Whether usage is unlimited",
		},
	];

	const prorationFields: FieldConfig[] = [
		{
			name: "on_increase",
			type: "OnIncrease",
			descriptionKey: "proration.on_increase",
			defaultDescription: "Behavior when quantity increases",
		},
		{
			name: "on_decrease",
			type: "OnDecrease",
			descriptionKey: "proration.on_decrease",
			defaultDescription: "Behavior when quantity decreases",
		},
	];

	const rolloverFields: FieldConfig[] = [
		{
			name: "max",
			type: "number",
			descriptionKey: "rollover.max",
			defaultDescription: "Maximum amount that can roll over",
		},
		{
			name: "expiry_duration_type",
			type: "ResetInterval",
			descriptionKey: "rollover.expiry_duration_type",
			defaultDescription: "How long rollover lasts before expiring",
		},
		{
			name: "expiry_duration_length",
			type: "number",
			optional: true,
			descriptionKey: "rollover.expiry_duration_length",
			defaultDescription: "Duration length for rollover expiry",
		},
	];

	const variants: DiscriminatedVariantConfig[] = [
		// Variant 1: With reset interval
		{
			name: "PlanFeatureWithReset",
			description: "Reset with interval (price cannot have interval)",
			fields: [
				...commonFields,
				{
					name: "reset",
					type: "object",
					defaultDescription: "Reset configuration for metered features",
					nestedFields: [
						{
							name: "interval",
							type: "ResetInterval",
							descriptionKey: "reset.interval",
							defaultDescription: "How often usage resets",
						},
						{
							name: "interval_count",
							type: "number",
							optional: true,
							descriptionKey: "reset.interval_count",
							defaultDescription: "Number of intervals between resets",
						},
						{
							name: "when_enabled",
							type: "boolean",
							optional: true,
							descriptionKey: "reset.when_enabled",
							defaultDescription:
								"Whether to reset usage when feature is enabled",
						},
					],
				},
				{
					name: "price",
					type: "object",
					optional: true,
					defaultDescription:
						"Pricing configuration (interval not allowed when using reset.interval)",
					nestedFields: [
						{
							name: "amount",
							type: "number",
							optional: true,
							descriptionKey: "price.amount",
							defaultDescription: "Flat price per unit in cents",
						},
						{
							name: "tiers",
							type: 'Array<{ to: number | "inf"; amount: number }>',
							optional: true,
							descriptionKey: "price.tiers",
							defaultDescription:
								"Tiered pricing structure based on usage ranges",
						},
						{
							name: "interval",
							type: "never",
							optional: true,
							defaultDescription: "Cannot be used with reset.interval",
						},
						{
							name: "interval_count",
							type: "never",
							optional: true,
							defaultDescription: "Cannot be used with reset.interval",
						},
						{
							name: "billing_units",
							type: "number",
							optional: true,
							descriptionKey: "price.billing_units",
							defaultDescription: "Number of units per billing cycle",
						},
						{
							name: "usage_model",
							type: "UsageModel",
							optional: true,
							descriptionKey: "price.usage_model",
							defaultDescription: "Billing model: 'prepaid' or 'pay_per_use'",
						},
						{
							name: "max_purchase",
							type: "number",
							optional: true,
							descriptionKey: "price.max_purchase",
							defaultDescription: "Maximum purchasable quantity",
						},
					],
				},
				{
					name: "proration",
					type: "object",
					optional: true,
					defaultDescription: "Proration rules for quantity changes",
					nestedFields: prorationFields,
				},
				{
					name: "rollover",
					type: "object",
					optional: true,
					defaultDescription: "Rollover policy for unused usage",
					nestedFields: rolloverFields,
				},
			],
		},
		// Variant 2: With price interval
		{
			name: "PlanFeatureWithPrice",
			description: "Price with interval (reset cannot have interval)",
			fields: [
				...commonFields,
				{
					name: "reset",
					type: "object",
					optional: true,
					defaultDescription:
						"Reset configuration (interval not allowed when using price.interval)",
					nestedFields: [
						{
							name: "interval",
							type: "never",
							optional: true,
							defaultDescription: "Cannot be used with price.interval",
						},
						{
							name: "interval_count",
							type: "never",
							optional: true,
							defaultDescription: "Cannot be used with price.interval",
						},
						{
							name: "when_enabled",
							type: "boolean",
							optional: true,
							descriptionKey: "reset.when_enabled",
							defaultDescription:
								"Whether to reset usage when feature is enabled",
						},
					],
				},
				{
					name: "price",
					type: "object",
					defaultDescription: "Pricing configuration for usage-based billing",
					nestedFields: [
						{
							name: "amount",
							type: "number",
							optional: true,
							descriptionKey: "price.amount",
							defaultDescription: "Flat price per unit in cents",
						},
						{
							name: "tiers",
							type: 'Array<{ to: number | "inf"; amount: number }>',
							optional: true,
							descriptionKey: "price.tiers",
							defaultDescription:
								"Tiered pricing structure based on usage ranges",
						},
						{
							name: "interval",
							type: "BillingInterval",
							descriptionKey: "price.interval",
							defaultDescription:
								"Billing frequency (cannot be used with reset.interval)",
						},
						{
							name: "interval_count",
							type: "number",
							optional: true,
							descriptionKey: "price.interval_count",
							defaultDescription: "Number of intervals between billing",
						},
						{
							name: "billing_units",
							type: "number",
							optional: true,
							descriptionKey: "price.billing_units",
							defaultDescription: "Number of units per billing cycle",
						},
						{
							name: "usage_model",
							type: "UsageModel",
							descriptionKey: "price.usage_model",
							defaultDescription: "Billing model: 'prepaid' or 'pay_per_use'",
						},
						{
							name: "max_purchase",
							type: "number",
							optional: true,
							descriptionKey: "price.max_purchase",
							defaultDescription: "Maximum purchasable quantity",
						},
					],
				},
				{
					name: "proration",
					type: "object",
					optional: true,
					defaultDescription: "Proration rules for quantity changes",
					nestedFields: prorationFields,
				},
				{
					name: "rollover",
					type: "object",
					optional: true,
					defaultDescription: "Rollover policy for unused usage",
					nestedFields: rolloverFields,
				},
			],
		},
		// Variant 3: Basic (neither has interval)
		{
			name: "PlanFeatureBasic",
			description: "Neither has interval",
			fields: [
				...commonFields,
				{
					name: "reset",
					type: "object",
					optional: true,
					defaultDescription: "Reset configuration (no interval)",
					nestedFields: [
						{
							name: "interval",
							type: "never",
							optional: true,
							defaultDescription: "Not allowed in this variant",
						},
						{
							name: "interval_count",
							type: "never",
							optional: true,
							defaultDescription: "Not allowed in this variant",
						},
						{
							name: "when_enabled",
							type: "boolean",
							optional: true,
							descriptionKey: "reset.when_enabled",
							defaultDescription:
								"Whether to reset usage when feature is enabled",
						},
					],
				},
				{
					name: "price",
					type: "object",
					optional: true,
					defaultDescription: "Pricing configuration (no interval)",
					nestedFields: [
						{
							name: "amount",
							type: "number",
							optional: true,
							descriptionKey: "price.amount",
							defaultDescription: "Flat price per unit in cents",
						},
						{
							name: "tiers",
							type: 'Array<{ to: number | "inf"; amount: number }>',
							optional: true,
							descriptionKey: "price.tiers",
							defaultDescription:
								"Tiered pricing structure based on usage ranges",
						},
						{
							name: "interval",
							type: "never",
							optional: true,
							defaultDescription: "Not allowed in this variant",
						},
						{
							name: "interval_count",
							type: "never",
							optional: true,
							defaultDescription: "Not allowed in this variant",
						},
						{
							name: "billing_units",
							type: "number",
							optional: true,
							descriptionKey: "price.billing_units",
							defaultDescription: "Number of units per billing cycle",
						},
						{
							name: "usage_model",
							type: "UsageModel",
							optional: true,
							descriptionKey: "price.usage_model",
							defaultDescription: "Billing model: 'prepaid' or 'pay_per_use'",
						},
						{
							name: "max_purchase",
							type: "number",
							optional: true,
							descriptionKey: "price.max_purchase",
							defaultDescription: "Maximum purchasable quantity",
						},
					],
				},
				{
					name: "proration",
					type: "object",
					optional: true,
					defaultDescription: "Proration rules for quantity changes",
					nestedFields: prorationFields,
				},
				{
					name: "rollover",
					type: "object",
					optional: true,
					defaultDescription: "Rollover policy for unused usage",
					nestedFields: rolloverFields,
				},
			],
		},
	];

	return generateDiscriminatedUnion({
		baseTypeName: "PlanFeature",
		unionTypeName: "PlanFeature",
		variants,
		metaDescriptions,
		typeAliases,
		comment:
			"Plan feature configuration with compile-time mutual exclusivity validation. Use reset.interval OR price.interval, but not both.",
	});
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
			name: "default",
			type: "boolean",
			optional: true,
			descriptionKey: "default",
			defaultDescription: "Whether this is the default plan for new customers",
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
					type: "BillingInterval",
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
