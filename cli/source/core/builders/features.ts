import {Feature} from 'autumn-js/compose';
import {snakeCaseToCamelCase} from '../utils.js';

export function featureBuilder(feature: Feature) {
    const snippet = `
export const ${snakeCaseToCamelCase(feature.id)} = feature({
    id: '${feature.id}',
    name: '${feature.name}',
    type: '${feature.type}',
})`
    return snippet;
}