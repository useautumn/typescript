import {Feature, Product, ProductItem} from 'autumn-js/compose';
import {externalRequest} from './api.js';

export async function getProducts(ids: string[]) {
	const products = await Promise.all(
		ids.map(id => externalRequest({
			method: "GET",
			path: `/products/${id}`,
		})),
	);
	return products.map(product => product as Product);
}

export async function getAllProducts() {
	const {list} = await externalRequest({
		method: "GET",
		path: '/products',
	});
	return list.map(product => product as Product);
}

export async function getFeatures() {
	const features = await externalRequest({
		method: "GET",
		path: '/features',
	});
	return features.map(feature => feature as Feature);
}
