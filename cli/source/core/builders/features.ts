import {Feature} from '../../compose/index.js';
import {idToVar} from '../utils.js';

export function featureBuilder(feature: Feature) {
	const snippet = `
export const ${idToVar(feature.id)} = feature({
    id: '${feature.id}',
    name: '${feature.name}',
    type: '${feature.type}',
})`;
	return snippet;
}
