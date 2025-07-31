import {Feature} from '../../compose/index.js';
import {idToVar} from '../utils.js';

const creditSchemaBuilder = (feature: Feature) => {
	if (feature.type == 'credit_system') {
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
    ]`;
	}
	return '';
};

export function featureBuilder(feature: Feature) {
	const snippet = `
export const ${idToVar(feature.id)} = feature({
    id: '${feature.id}',
    name: '${feature.name}',
    type: '${feature.type}',${creditSchemaBuilder(feature)}
})`;
	return snippet;
}
