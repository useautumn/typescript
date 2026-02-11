import type { Feature, Plan, PlanFeature } from "../../compose/index.js";
import {
	formatAmount,
	formatInterval,
	formatTiers,
	getFeatureName,
	numberWithCommas,
} from "./displayUtils.js";
import {
	type FeatureLike,
	featureToDisplayFeature,
	type ProductItemLike,
	planFeatureToItem,
} from "./planFeatureToItem.js";

// =============================================================================
// Types
// =============================================================================

export interface PlanFeatureDisplay {
	primary_text: string;
	secondary_text?: string;
	tier_details?: string[]; // For tiered pricing breakdown
}

export interface PlanPreview {
	name: string;
	basePrice?: string; // e.g., "$10/month" or "Free"
	freeTrial?: string; // e.g., "7 day free trial"
	features: PlanFeatureDisplay[];
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Get the interval display string from a ProductItemLike
 */
const getIntervalDisplay = (item: ProductItemLike): string | undefined => {
	if (!item.interval) return undefined;

	return (
		formatInterval({
			interval: item.interval,
			intervalCount: item.interval_count ?? 1,
		}) || undefined
	);
};

/**
 * Format tier details for display as sub-items.
 * e.g., ["1 - 1,000: $0.05", "1,001 - 10,000: $0.02", "10,001+: $0.01"]
 */
const formatTierDetails = ({
	tiers,
	currency,
}: {
	tiers: Array<{ to: number | "inf"; amount: number }>;
	currency: string;
}): string[] => {
	if (tiers.length <= 1) return [];

	const details: string[] = [];
	let prevTo = 0;

	for (const tier of tiers) {
		const from = prevTo + 1;
		const price = formatAmount({ amount: tier.amount, currency });

		if (tier.to === "inf") {
			details.push(`${numberWithCommas(from)}+: ${price}`);
		} else {
			details.push(
				`${numberWithCommas(from)} - ${numberWithCommas(tier.to)}: ${price}`,
			);
			prevTo = tier.to;
		}
	}

	return details;
};

/**
 * Build the price portion of the display string using ProductItemLike.
 * Handles flat pricing, tiered pricing, and billing units.
 * Returns both the price string and optional tier details.
 */
const buildPriceString = ({
	item,
	feature,
	currency,
}: {
	item: ProductItemLike;
	feature: FeatureLike;
	currency: string;
}): { priceStr: string; tierDetails?: string[] } | null => {
	// Must have price or tiers
	if (item.price === null && !item.tiers) return null;

	const billingUnits = item.billing_units ?? 1;
	const featureName = getFeatureName({ feature, units: billingUnits });

	let priceStr: string;
	let tierDetails: string[] | undefined;

	// Tiered pricing takes precedence
	if (item.tiers && item.tiers.length > 0) {
		priceStr = formatTiers({ tiers: item.tiers, currency });
		tierDetails = formatTierDetails({ tiers: item.tiers, currency });
	} else if (item.price !== null) {
		priceStr = formatAmount({ amount: item.price, currency });
	} else {
		return null;
	}

	// Build "per X" part
	let perPart: string;
	if (billingUnits > 1) {
		perPart = `per ${numberWithCommas(billingUnits)} ${featureName}`;
	} else {
		perPart = `per ${getFeatureName({ feature, units: 1 })}`;
	}

	return { priceStr: `${priceStr} ${perPart}`, tierDetails };
};

// =============================================================================
// Main Functions
// =============================================================================

/**
 * Convert a PlanFeature to display strings.
 *
 * Uses ProductItemLike translation layer to align with @autumn/shared display logic.
 *
 * Edge cases handled:
 * - Boolean feature: Just show feature name
 * - Unlimited: "Unlimited messages per month"
 * - Included only (no price): "1,000 messages per month"
 * - Included + price: "100 credits then $0.01 per credit per month"
 * - Price only (no included): "$0.01 per credit per month"
 * - Tiered pricing: "$0.10 - $0.05 per message per month"
 * - Billing units > 1: "$1.00 per 100 credits per month"
 */
export const getPlanFeatureDisplay = ({
	planFeature,
	feature,
	currency = "USD",
}: {
	planFeature: PlanFeature;
	feature: Feature;
	currency?: string;
}): PlanFeatureDisplay => {
	// Convert to ProductItemLike for consistent handling
	const item = planFeatureToItem({ planFeature });
	const displayFeature = featureToDisplayFeature({ feature });

	// Boolean features just show the feature name
	// Also handle legacy "static" type which maps to boolean
	const featureType = feature.type as string;
	if (featureType === "boolean" || featureType === "static") {
		return {
			primary_text: feature.name,
		};
	}

	const intervalStr = getIntervalDisplay(item) ?? "";

	// Handle unlimited (included_usage === "inf")
	if (item.included_usage === "inf") {
		const featureName = getFeatureName({
			feature: displayFeature,
			units: "inf",
		});
		const parts = ["Unlimited", featureName];
		if (intervalStr) {
			parts.push(intervalStr);
		}
		return {
			primary_text: parts.join(" "),
		};
	}

	// Get included amount
	const included = item.included_usage;
	const hasIncluded =
		included !== null && typeof included === "number" && included > 0;

	// Build price string if price exists
	const priceResult = buildPriceString({
		item,
		feature: displayFeature,
		currency,
	});

	// Case: Included + price
	// "100 credits then $0.01 per credit per month"
	if (hasIncluded && priceResult) {
		const featureName = getFeatureName({
			feature: displayFeature,
			units: included,
		});
		const includedPart = `${numberWithCommas(included)} ${featureName}`;

		const parts = [includedPart, "then", priceResult.priceStr];
		if (intervalStr) {
			parts.push(intervalStr);
		}
		return {
			primary_text: parts.join(" "),
			tier_details: priceResult.tierDetails,
		};
	}

	// Case: Included only (no price)
	// "1,000 messages per month"
	if (hasIncluded && !priceResult) {
		const featureName = getFeatureName({
			feature: displayFeature,
			units: included,
		});
		const parts = [`${numberWithCommas(included)} ${featureName}`];
		if (intervalStr) {
			parts.push(intervalStr);
		}
		return {
			primary_text: parts.join(" "),
		};
	}

	// Case: Price only (no included)
	// "$0.01 per credit per month"
	if (priceResult) {
		const parts = [priceResult.priceStr];
		if (intervalStr) {
			parts.push(intervalStr);
		}
		return {
			primary_text: parts.join(" "),
			tier_details: priceResult.tierDetails,
		};
	}

	// Fallback: Just show feature name (e.g., feature with no configuration)
	return {
		primary_text: feature.name,
	};
};

/**
 * Convert a full Plan to preview format.
 */
export const getPlanPreview = ({
	plan,
	features,
	currency = "USD",
}: {
	plan: Plan;
	features: Feature[];
	currency?: string;
}): PlanPreview => {
	// 1. Build basePrice string
	let basePrice: string | undefined;

	if (plan.price) {
		const amount = formatAmount({ amount: plan.price.amount, currency });
		const interval = formatInterval({
			interval: plan.price.interval,
			prefix: "/",
		});
		basePrice = `${amount}${interval}`;
	} else {
		// Check if any items have pricing
		const hasPricedFeatures = plan.items?.some((pf) => pf.price) ?? false;

		if (hasPricedFeatures) {
			// Has usage-based pricing but no base price
			basePrice = undefined; // Omit basePrice, show as usage-based
		} else {
			// No price and no priced features = Free
			basePrice = "Free";
		}
	}

	// 2. Build freeTrial string if plan.free_trial exists
	let freeTrial: string | undefined;

	if (plan.free_trial) {
		const { duration_length, duration_type } = plan.free_trial;
		const durationUnit =
			duration_length === 1 ? duration_type : `${duration_type}s`;
		freeTrial = `${duration_length} ${durationUnit} free trial`;
	}

	// 3. Map plan.items to PlanFeatureDisplay[]
	const featureDisplays: PlanFeatureDisplay[] = [];

	if (plan.items) {
		for (const planFeature of plan.items) {
			// Find matching Feature by feature_id
			const feature = features.find((f) => f.id === planFeature.feature_id);

			if (feature) {
				const display = getPlanFeatureDisplay({
					planFeature,
					feature,
					currency,
				});
				featureDisplays.push(display);
			} else {
				// Feature not found, show feature_id as fallback
				featureDisplays.push({
					primary_text: planFeature.feature_id,
				});
			}
		}
	}

	return {
		name: plan.name,
		basePrice,
		freeTrial,
		features: featureDisplays,
	};
};

/**
 * Render PlanPreview to plain text for CLI.
 *
 * Output format:
 * Pro
 * $10/month
 * 7 day free trial
 * ├─ Unlimited API calls per month
 * ├─ 1,000 messages per month
 * └─ $0.05 - $0.01 per credit per month
 *    ├─ 1 - 1,000: $0.05
 *    ├─ 1,001 - 10,000: $0.02
 *    └─ 10,001+: $0.01
 */
export const formatPlanPreviewAsText = ({
	preview,
}: {
	preview: PlanPreview;
}): string => {
	const lines: string[] = [];

	// Plan name
	lines.push(preview.name);

	// Base price (if present)
	if (preview.basePrice) {
		lines.push(preview.basePrice);
	}

	// Free trial (if present)
	if (preview.freeTrial) {
		lines.push(preview.freeTrial);
	}

	// Features with box-drawing characters
	const featureCount = preview.features.length;

	for (let i = 0; i < featureCount; i++) {
		const feature = preview.features[i];
		const isLastFeature = i === featureCount - 1;
		const featurePrefix = isLastFeature ? "\u2514\u2500" : "\u251C\u2500"; // "└─" or "├─"

		lines.push(`${featurePrefix} ${feature.primary_text}`);

		// Add secondary text if present (indented under the feature)
		if (feature.secondary_text) {
			const secondaryPrefix = isLastFeature ? "   " : "\u2502  "; // "│  " or "   "
			lines.push(`${secondaryPrefix}${feature.secondary_text}`);
		}

		// Add tier details as a sub-tree if present
		if (feature.tier_details && feature.tier_details.length > 0) {
			const tierCount = feature.tier_details.length;
			const baseIndent = isLastFeature ? "   " : "\u2502  "; // "│  " or "   "

			for (let j = 0; j < tierCount; j++) {
				const tierDetail = feature.tier_details[j];
				const isLastTier = j === tierCount - 1;
				const tierPrefix = isLastTier ? "\u2514\u2500" : "\u251C\u2500"; // "└─" or "├─"

				lines.push(`${baseIndent}${tierPrefix} ${tierDetail}`);
			}
		}
	}

	return lines.join("\n");
};
