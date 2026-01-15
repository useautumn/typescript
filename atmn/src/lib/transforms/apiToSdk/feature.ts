import type { Feature } from "../../../../source/compose/models/featureModels.js";
import type { ApiFeature } from "../../api/types/index.js";
import { createTransformer } from "./Transformer.js";

/**
 * Declarative feature transformer - replaces 79 lines with 40 lines of config
 */
export const featureTransformer = createTransformer<any, Feature>({
	discriminator: 'type',
	cases: {
		// Boolean features: just copy base fields, no consumable
		'boolean': {
			copy: ['id', 'name', 'event_names', 'credit_schema'],
			compute: {
				type: () => 'boolean' as const,
			},
		},
		
		// Credit system features: always consumable
		'credit_system': {
			copy: ['id', 'name', 'event_names', 'credit_schema'],
			compute: {
				type: () => 'credit_system' as const,
				consumable: () => true,
				credit_schema: (api) => api.credit_schema || [],
			},
		},
		
		// Backend bug: API returns "single_use" instead of "metered" with consumable=true
		'single_use': {
			copy: ['id', 'name', 'event_names', 'credit_schema'],
			compute: {
				type: () => 'metered' as const,
				consumable: () => true,
			},
		},
		
		// Backend bug: API returns "continuous_use" instead of "metered" with consumable=false
		'continuous_use': {
			copy: ['id', 'name', 'event_names', 'credit_schema'],
			compute: {
				type: () => 'metered' as const,
				consumable: () => false,
			},
		},
		
		// If API ever returns "metered" properly
		'metered': {
			copy: ['id', 'name', 'event_names', 'credit_schema'],
			compute: {
				type: () => 'metered' as const,
				consumable: (api) => api.consumable ?? true,
			},
		},
	},
	
	// Fallback for unknown types
	default: {
		copy: ['id', 'name', 'event_names', 'credit_schema'],
		compute: {
			type: () => 'metered' as const,
			consumable: () => true,
		},
	},
});

export function transformApiFeature(apiFeature: any): Feature {
	return featureTransformer.transform(apiFeature);
}
