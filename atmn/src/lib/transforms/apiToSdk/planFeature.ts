import type { PlanFeature } from "../../../../source/compose/models/planModels.js";
import type { ApiPlanFeature } from "../../api/types/index.js";
import { invertResetWhenEnabled, mapUsageModel } from "./helpers.js";
import { createTransformer } from "./Transformer.js";

/**
 * Declarative plan feature transformer - replaces 77 lines with ~30 lines of config
 */
export const planFeatureTransformer = createTransformer<
	ApiPlanFeature,
	PlanFeature
>({
	copy: ["feature_id", "unlimited", "proration"],

	// Rename: granted_balance → included
	rename: {
		granted_balance: "included",
	},

	// Flatten: reset.* → top-level fields
	flatten: {
		"reset.interval": "interval",
		"reset.interval_count": "interval_count",
	},

	// Computed fields
	compute: {
		// Invert: reset.reset_when_enabled → carry_over_usage
		carry_over_usage: (api) =>
			api.reset?.reset_when_enabled !== undefined
				? invertResetWhenEnabled(api.reset.reset_when_enabled)
				: undefined,

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
