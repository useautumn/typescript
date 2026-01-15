/**
 * Helper functions for API → SDK transformations
 */

/**
 * Map API feature type to SDK type
 * API uses "metered" but SDK distinguishes between metered consumable and non-consumable
 */
export function mapFeatureType(
	apiType: string,
	consumable: boolean,
): "boolean" | "metered" | "credit_system" {
	if (apiType === "boolean") {
		return "boolean";
	}
	if (apiType === "credit_system") {
		return "credit_system";
	}
	// For metered, the SDK doesn't actually use different type values
	// The consumable field is what matters
	return "metered";
}

/**
 * Invert reset_when_enabled to carry_over_usage
 * API: reset_when_enabled = true means reset usage when enabled
 * SDK: carry_over_usage = true means DON'T reset (i.e., carry over)
 * So they're opposites
 */
export function invertResetWhenEnabled(
	resetWhenEnabled: boolean | undefined,
): boolean | undefined {
	if (resetWhenEnabled === undefined) {
		return undefined;
	}
	return !resetWhenEnabled;
}

/**
 * Map API usage_model to SDK billing_method
 */
export function mapUsageModel(
	usageModel: string,
): "prepaid" | "pay_per_use" | undefined {
	if (usageModel === "prepaid") {
		return "prepaid";
	}
	if (usageModel === "pay_per_use") {
		return "pay_per_use";
	}
	return undefined;
}
