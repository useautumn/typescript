import {Feature} from '../../compose/index.js';
import {idToVar} from '../utils.js';

export function featureBuilder(feature: Feature) {
	const {credit_schema, type} = feature;
	let creditSchema = '';
	
	if (type === 'credit_system' && credit_schema) {
		creditSchema = `credit_schema: ${JSON.stringify(credit_schema, null, 2)}`;
	}
	
	const snippet = `
export const ${idToVar(feature.id)} = feature({
    id: '${feature.id}',
    name: '${feature.name}',
    type: '${feature.type}'${creditSchema ? `,
    ${creditSchema}` : ''}
})`;
	return snippet;
}
