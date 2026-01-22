import type { Feature, Plan, PlanFeature } from "../../../source/compose/models/index.js";

/**
 * Validation errors with user-friendly messages.
 */
export interface ValidationError {
	path: string;
	message: string;
}

export interface ValidationResult {
	valid: boolean;
	errors: ValidationError[];
}

/**
 * Validate a plan feature has all required fields.
 */
function validatePlanFeature(
	feature: PlanFeature,
	planId: string,
	featureIndex: number,
): ValidationError[] {
	const errors: ValidationError[] = [];
	const featureId = feature.feature_id || `(no feature_id)`;
	const basePath = `plan "${planId}" → features[${featureIndex}] (${featureId})`;

	// If price is defined, validate required price fields
	if (feature.price) {
		// billing_method is required when price is defined
		if (!feature.price.billing_method) {
			errors.push({
				path: `${basePath} → price`,
				message: `"billing_method" is required when "price" is defined. Must be "prepaid" or "usage_based".`,
			});
		}

		// If price has amount or tiers, reset.interval must be defined
		if ((feature.price.amount !== undefined || feature.price.tiers) && !feature.reset?.interval) {
			errors.push({
				path: basePath,
				message: `"reset.interval" is required when pricing is defined (e.g., reset: { interval: "month" }).`,
			});
		}
	}

	// If reset is specified, interval MUST be explicitly defined (not null/undefined)
	if (feature.reset !== undefined) {
		if (feature.reset.interval === undefined || feature.reset.interval === null) {
			errors.push({
				path: `${basePath} → reset`,
				message: `"interval" is required when "reset" is specified. Must be one of: one_off, minute, hour, day, week, month, quarter, year.`,
			});
		} else {
			// Validate interval is a valid value
			const validIntervals = ["one_off", "minute", "hour", "day", "week", "month", "quarter", "year"];
			if (!validIntervals.includes(feature.reset.interval)) {
				errors.push({
					path: `${basePath} → reset.interval`,
					message: `Invalid interval "${feature.reset.interval}". Must be one of: ${validIntervals.join(", ")}.`,
				});
			}
		}
	}

	return errors;
}

/**
 * Validate a plan has all required fields.
 */
function validatePlan(plan: Plan): ValidationError[] {
	const errors: ValidationError[] = [];
	const planId = plan.id || "(no id)";

	// id is required
	if (!plan.id) {
		errors.push({
			path: "plan",
			message: `"id" is required.`,
		});
	}

	// name is required
	if (!plan.name) {
		errors.push({
			path: `plan "${planId}"`,
			message: `"name" is required.`,
		});
	}

	// If price is defined, validate it
	if (plan.price) {
		if (plan.price.amount === undefined) {
			errors.push({
				path: `plan "${planId}" → price`,
				message: `"amount" is required when "price" is defined.`,
			});
		}
		if (!plan.price.interval) {
			errors.push({
				path: `plan "${planId}" → price`,
				message: `"interval" is required when "price" is defined (e.g., interval: "month").`,
			});
		}
	}

	// If auto_enable is true and free_trial.card_required is true, that's invalid
	// Customers shouldn't be auto-enrolled in a trial that requires card input
	if (plan.auto_enable === true && plan.free_trial?.card_required === true) {
		errors.push({
			path: `plan "${planId}"`,
			message: `"auto_enable" cannot be true when "free_trial.card_required" is true. Customers cannot be auto-enrolled in a trial that requires card input.`,
		});
	}

	// Validate each plan feature
	if (plan.features && Array.isArray(plan.features)) {
		for (let i = 0; i < plan.features.length; i++) {
			const feature = plan.features[i];
			if (feature) {
				// feature_id is required
				if (!feature.feature_id) {
					errors.push({
						path: `plan "${planId}" → features[${i}]`,
						message: `"feature_id" is required.`,
					});
				}
				errors.push(...validatePlanFeature(feature, planId, i));
			}
		}
	}

	return errors;
}

/**
 * Validate a feature has all required fields.
 */
function validateFeature(feature: Feature): ValidationError[] {
	const errors: ValidationError[] = [];
	const featureId = feature.id || "(no id)";

	// id is required
	if (!feature.id) {
		errors.push({
			path: "feature",
			message: `"id" is required.`,
		});
	}

	// name is required
	if (!feature.name) {
		errors.push({
			path: `feature "${featureId}"`,
			message: `"name" is required.`,
		});
	}

	// type is required
	if (!feature.type) {
		errors.push({
			path: `feature "${featureId}"`,
			message: `"type" is required. Must be "boolean", "metered", or "credit_system".`,
		});
	}

	// If type is metered, consumable is required
	if (feature.type === "metered") {
		const meteredFeature = feature as { consumable?: boolean };
		if (meteredFeature.consumable === undefined) {
			errors.push({
				path: `feature "${featureId}"`,
				message: `"consumable" is required for metered features. Set to true (usage is consumed) or false (usage accumulates).`,
			});
		}
	}

	// If type is credit_system, credit_schema is required
	if (feature.type === "credit_system") {
		if (!feature.credit_schema || feature.credit_schema.length === 0) {
			errors.push({
				path: `feature "${featureId}"`,
				message: `"credit_schema" is required for credit_system features.`,
			});
		}
	}

	return errors;
}

/**
 * Validate local config before pushing.
 * 
 * This catches missing required fields and provides helpful error messages
 * before the API returns confusing Zod validation errors.
 */
export function validateConfig(
	features: Feature[],
	plans: Plan[],
): ValidationResult {
	const errors: ValidationError[] = [];

	// Validate features
	for (const feature of features) {
		errors.push(...validateFeature(feature));
	}

	// Validate plans
	for (const plan of plans) {
		errors.push(...validatePlan(plan));
	}

	return {
		valid: errors.length === 0,
		errors,
	};
}

/**
 * Format validation errors for console output.
 */
export function formatValidationErrors(errors: ValidationError[]): string {
	const lines: string[] = [];

	for (const error of errors) {
		lines.push(`  ${error.path}`);
		lines.push(`    ${error.message}`);
		lines.push("");
	}

	return lines.join("\n");
}
