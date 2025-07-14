import {ProductItem, Product} from 'autumn-js/compose';
import {snakeCaseToCamelCase} from '../utils.js';

const ItemBuilders = {
    priced_feature: pricedFeatureItemBuilder,
    feature: featureItemBuilder,
    price: priceItemBuilder
}

export function importBuilder() {
    return `
import {
	feature,
	product,
	featureItem,
	pricedFeatureItem,
	priceItem,
} from 'autumn-js/compose';
    `
}

export function exportBuilder(productIds: string[], featureIds: string[]) {
    const snippet = `
export default {
    products: [${productIds.map(id => `${id}Plan`).join(', ')}],
    features: [${featureIds.map(id => `${id}`).join(', ')}]
}
    `
    return snippet;
}

export function productBuilder(product: Product) {
    const snippet = `
export const ${product.id}Plan = product({
    id: '${product.id}',
    name: '${product.name}',
    items: [${product.items.map((item: ProductItem) => `${ItemBuilders[item.type](item)}`).join('           ')}     ]
})
`
    return snippet;
}

// Item Builders

export function pricedFeatureItemBuilder(item: ProductItem) {
    const snippet = `
        pricedFeatureItem({
            feature_id: ${snakeCaseToCamelCase(item.feature_id)}.id,
            price: ${item.price},
            interval: '${item.interval}',
            included_usage: ${item.included_usage},
            billing_units: ${item.billing_units},
            usage_model: '${item.usage_model}',
        }),
`
    return snippet;
}

export function featureItemBuilder(item: ProductItem)  {
    const snippet = `
        featureItem({
            feature_id: ${snakeCaseToCamelCase(item.feature_id)}.id,
            included_usage: ${item.included_usage},
            interval: '${item.interval}',
        }),
`
    return snippet;
}

export function priceItemBuilder(item: ProductItem) {
    const snippet = `
        priceItem({
            price: ${item.price},
            interval: '${item.interval}',
        }),
`
    return snippet;
}