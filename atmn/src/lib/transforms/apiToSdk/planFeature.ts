import type { PlanFeature } from "../../../../source/compose/models/planModels.js";
import type { ApiPlanFeature } from "../../api/types/index.js";
import { mapUsageModel } from "./helpers.js";
import { createTransformer } from "./Transformer.js";

/**
 * Declarative plan feature transformer
 * 
 * Handles mutually exclusive reset patterns:
 * - API reset.interval -> SDK top-level reset (when no price, or price without interval)
 * - API price.interval -> SDK price.interval (when price exists)
 */
export const planFeatureTransformer = createTransformer<
	ApiPlanFeature,
	PlanFeature
>({
	copy: ["feature_id", "unlimited", "proration"],

	// Computed fields
	compute: {
		// Only include 'included' (granted_balance) if not unlimited
		included: (api) => 
			api.unlimited ? undefined : api.granted_balance,

		// Top-level reset: only from api.reset when there's no price with interval
		// If price exists with interval, the interval belongs in price.interval, not top-level
		reset: (api) => {
			// If price exists with interval, the reset belongs in price.interval, not top-level
			if (api.price?.interval) {
				return undefined;
			}
			// Only use top-level reset from api.reset
			if (api.reset) {
				return {
					interval: api.reset.interval,
					interval_count: api.reset.interval_count,
				};
			}
			return undefined;
		},

		// Transform price object with interval directly on price
		price: (api) => {
			if (!api.price) return undefined;
			
			const billingMethod = api.price.usage_model
				? mapUsageModel(api.price.usage_model)
				: undefined;
			
			// Build price object with interval directly on it
			return {
				amount: api.price.amount,
				tiers: api.price.tiers,
				billing_units: api.price.billing_units,
				max_purchase: api.price.max_purchase ?? undefined,
				billing_method: billingMethod,
				// Map API price.interval directly to SDK price.interval
				interval: api.price.interval,
				interval_count: api.price.interval_count,
			};
		},

		// Transform rollover object
		rollover: (api) =>
			api.rollover
				? {
					...api.rollover,
					max: api.rollover.max ?? 0,
				}
				: undefined,
	},
});

export function transformApiPlanFeature(
	apiPlanFeature: ApiPlanFeature,
): PlanFeature {
	return planFeatureTransformer.transform(apiPlanFeature);
}
