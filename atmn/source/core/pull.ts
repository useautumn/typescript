import {Feature, Product} from '../compose/models/composeModels.js';
import {externalRequest} from './api.js';

export async function getProducts(ids: string[]) {
	const products = await Promise.all(
		ids.map(id =>
			externalRequest({
				method: 'GET',
				path: `/products/${id}`,
			}),
		),
	);
	return products.map(product => product as Product);
}

export async function getAllProducts() {
	const {list} = await externalRequest({
		method: 'GET',
		path: '/products',
	});

	return list.map((product: Product) => product as Product);
}

export async function getFeatures() {
	const {list} = await externalRequest({
		method: 'GET',
		path: '/features',
	});

	for (const feature of list) {
		if (feature.type == 'credit_system') {
			console.log(feature.credit_schema);
		}
	}

	return list.map((feature: Feature) => feature as Feature);
}
