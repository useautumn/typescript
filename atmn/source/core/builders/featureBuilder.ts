import {Feature} from '../../compose/index.js';
import {idToVar, notNullish} from '../utils.js';

const creditSchemaBuilder = (feature: Feature) => {
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

export function featureBuilder(feature: Feature) {
	const nameStr = notNullish(feature.name) ? `\n    name: '${feature.name}',` : '';
	const creditSchemaStr = creditSchemaBuilder(feature);

	const snippet = `
export const ${idToVar({id: feature.id, prefix: 'feature'})} = feature({
    id: '${feature.id}',${nameStr}
    type: '${feature.type}',${creditSchemaStr}
})`;
	return snippet;
}
