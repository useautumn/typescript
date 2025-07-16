import {ProductItem, Product} from '../../compose/index.js';
import {idToVar} from '../utils.js';

const ItemBuilders = {
	priced_feature: pricedFeatureItemBuilder,
	feature: featureItemBuilder,
	price: priceItemBuilder,
};

export function importBuilder() {
	return `
import {
	feature,
	product,
	featureItem,
	pricedFeatureItem,
	priceItem,
} from 'atmn';
    `;
}

export function exportBuilder(productIds: string[], featureIds: string[]) {
	const snippet = `
const autumnConfig = {
    products: [${productIds.map(id => `${idToVar(id)}`).join(', ')}],
    features: [${featureIds.map(id => `${idToVar(id)}`).join(', ')}]
}

export default autumnConfig;
    `;
	return snippet;
}

export function productBuilder(product: Product) {
	const snippet = `
export const ${idToVar(product.id)} = product({
    id: '${product.id}',
    name: '${product.name}',
    items: [${product.items
			.map(
				(item: ProductItem) =>
					`${ItemBuilders[item.type as keyof typeof ItemBuilders](item)}`,
			)
			.join('           ')}     ]
})
`;
	return snippet;
}

// Item Builders

export function pricedFeatureItemBuilder(item: ProductItem) {
	const intervalLine =
		item.interval == null ? '' : `\n            interval: '${item.interval}',`;
	const snippet = `
        pricedFeatureItem({
            feature_id: ${idToVar(item.feature_id!)}.id,
            price: ${item.price},${intervalLine}
            included_usage: ${item.included_usage},
            billing_units: ${item.billing_units},
            usage_model: '${item.usage_model}',
        }),
`;
	return snippet;
}

export function featureItemBuilder(item: ProductItem) {
	const intervalLine =
		item.interval == null ? '' : `\n            interval: '${item.interval}',`;
	const snippet = `
        featureItem({
            feature_id: ${idToVar(item.feature_id!)}.id,
            included_usage: ${item.included_usage},${intervalLine}
        }),
`;
	return snippet;
}

export function priceItemBuilder(item: ProductItem) {
	const intervalLine =
		item.interval == null ? '' : `\n            interval: '${item.interval}',`;
	const snippet = `
        priceItem({
            price: ${item.price},${intervalLine}
        }),
`;
	return snippet;
}
