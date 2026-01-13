import {idToVar, notNullish} from '../utils.js';

// API feature type (what comes from the server)
type ApiFeatureType = 'boolean' | 'single_use' | 'continuous_use' | 'credit_system' | 'static';

type ApiFeature = {
	id: string;
	name?: string | null;
	type: ApiFeatureType;
	credit_schema?: Array<{
		metered_feature_id: string;
		credit_cost: number;
	}>;
};

const creditSchemaBuilder = (feature: ApiFeature) => {
	if (feature.type === 'credit_system' && feature.credit_schema) {
		let creditSchema = feature.credit_schema || [];
		return `
    credit_schema: [
        ${creditSchema
					.map(
						credit => `{
            metered_feature_id: '${credit.metered_feature_id}',
            credit_cost: ${credit.credit_cost},
        }`,
					)
					.join(',\n        ')}
    ],`;
	}
	return '';
};

/**
 * Maps API feature type to SDK type and consumable field
 * - API 'boolean' -> SDK type: 'boolean' (no consumable)
 * - API 'single_use' -> SDK type: 'metered', consumable: true
 * - API 'continuous_use' -> SDK type: 'metered', consumable: false
 * - API 'credit_system' -> SDK type: 'credit_system' (no consumable needed)
 */
function getTypeAndConsumable(apiType: ApiFeatureType): {type: string; consumable?: boolean} {
	switch (apiType) {
		case 'single_use':
			return {type: 'metered', consumable: true};
		case 'continuous_use':
			return {type: 'metered', consumable: false};
		case 'boolean':
			return {type: 'boolean'};
		case 'credit_system':
			return {type: 'credit_system'};
		case 'static':
			return {type: 'boolean'}; // static maps to boolean in SDK
		default:
			return {type: apiType};
	}
}

export function featureBuilder(feature: ApiFeature) {
	const nameStr = notNullish(feature.name) ? `\n    name: '${feature.name}',` : '';
	const creditSchemaStr = creditSchemaBuilder(feature);
	const {type, consumable} = getTypeAndConsumable(feature.type);

	// Build consumable string only for metered features
	const consumableStr = consumable !== undefined ? `\n    consumable: ${consumable},` : '';

	const snippet = `
export const ${idToVar({id: feature.id, prefix: 'feature'})} = feature({
    id: '${feature.id}',${nameStr}
    type: '${type}',${consumableStr}${creditSchemaStr}
})`;
	return snippet;
}
