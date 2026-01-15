import type { Plan } from "../../../../source/compose/models/planModels.js";
import type { ApiPlan } from "../../api/types/index.js";
import { createTransformer } from "./Transformer.js";
import { transformApiPlanFeature } from "./planFeature.js";

/**
 * Declarative plan transformer - replaces 57 lines with ~20 lines of config
 */
export const planTransformer = createTransformer<ApiPlan, Plan>({
	copy: [
		'id',
		'name', 
		'description',
		'group',
		'add_on',
		'free_trial',
	],
	
	// Rename: default → auto_enable
	rename: {
		'default': 'auto_enable',
	},
	
	// Swap null to undefined for these fields (API → SDK direction)
	// When pulling from API: null becomes undefined (cleaner, won't show in generated code)
	swapNullish: ['group'],
	
	// Swap false to undefined for these fields (API → SDK direction)
	// When pulling from API: false becomes undefined (only true or undefined in SDK)
	// API 'default' field maps to SDK 'auto_enable', API 'add_on' stays as 'add_on'
	swapFalse: ['default', 'add_on'],
	
	// Copy nested price object as-is
	compute: {
		price: (api) => api.price ? {
			amount: api.price.amount,
			interval: api.price.interval,
		} : undefined,
		
		// Transform features array (only if non-empty)
		features: (api) => 
			api.features && api.features.length > 0
				? api.features.map(transformApiPlanFeature)
				: undefined,
	},
});

export function transformApiPlan(apiPlan: ApiPlan): Plan {
	return planTransformer.transform(apiPlan);
}
