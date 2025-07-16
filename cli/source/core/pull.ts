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

	return list.map((feature: Feature) => feature as Feature);
}
