import type { PlanFeature } from "../../../../source/compose/models/planModels.js";
import type { ApiPlanFeature } from "../../api/types/index.js";
import { mapUsageModel } from "./helpers.js";
import { createTransformer } from "./Transformer.js";

/**
 * Declarative plan feature transformer - replaces 77 lines with ~30 lines of config
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

		// Keep reset nested, but strip out reset_when_enabled (we ignore it)
		// If reset is null but price has an interval, derive reset from price.interval
		reset: (api) => {
			if (api.reset) {
				return {
					interval: api.reset.interval,
					interval_count: api.reset.interval_count,
				};
			}
			// If no explicit reset but price exists with interval, derive reset from it
			if (api.price?.interval) {
				return {
					interval: api.price.interval,
					interval_count: api.price.interval_count,
				};
			}
			return undefined;
		},

		// Transform price object
		price: (api) =>
			api.price
				? {
					...api.price,
					max_purchase: api.price.max_purchase ?? undefined,
					billing_method: api.price.usage_model
						? mapUsageModel(api.price.usage_model)
						: undefined,
				}
				: undefined,

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
