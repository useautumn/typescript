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
 * Map API usage_model to SDK billing_method
 * API uses 'pay_per_use', SDK uses 'usage_based'
 */
export function mapUsageModel(
	usageModel: string,
): "prepaid" | "usage_based" | undefined {
	if (usageModel === "prepaid") {
		return "prepaid";
	}
	if (usageModel === "pay_per_use") {
		return "usage_based";
	}
	return undefined;
}
