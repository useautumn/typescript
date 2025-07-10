import { Feature, Product, ProductItem } from 'autumn-compose';
import {request} from './api.js';

export async function getProducts(ids: string[]) {
    const products = await Promise.all(ids.map(id => request('GET', `/products/${id}`)));
    return products.map(product => product as Product);
}

export async function getAllProducts() {
    const { list } = await request('GET', '/products');
    return list.map(product => product as Product);
}

export async function getFeatures() {
    const features = await request('GET', '/features');
    return features.map(feature => feature as Feature);
}

function whichItemCallable(item_type: string) {
    switch (item_type) {
        case 'feature':
            return 'featureItem';
        case 'priced_feature':
            return 'pricedFeatureItem';
        default:
            throw new Error(`Unknown item type: ${item_type}`);
    }
}

export function buildItemCallable(item: ProductItem) {
    let callable = whichItemCallable(item.type);
    return `${callable}({
    feature_id: '${item.feature_id}',
    included_usage: ${item.included_usage},
    interval: ProductItemInterval.${capitalizeItemInterval(item.interval)},
    usage_model: ${item.usage_model},
    price: ${item.price},
    billing_units: ${item.billing_units},
})`;
}

function capitalizeItemInterval(interval: string) {
    return interval[0].toUpperCase() + interval.slice(1);
}
export function buildProductBuilderString(product: Product) {
    return `
const ${product.id}Plan = product({
id: '${product.id}',
name: '${product.name}',
items: [
        ${product.items.map(item => `${whichItemCallable(item.type)}({
    feature_id: '${item.feature_id}',
    included_usage: ${item.included_usage},
    interval: ProductItemInterval.${capitalizeItemInterval(item.interval)},
    usage_model: ${item.usage_model},
    price: ${item.price},
    billing_units: ${item.billing_units},
}`).join(',\n')}
])`;
}
