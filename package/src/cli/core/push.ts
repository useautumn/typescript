import {Feature, Product} from 'autumn-compose';
import {request} from './api.js';
import {getFeatures, getAllProducts} from './pull.js';

export async function checkForDeletables(
	currentFeatures: Feature[],
	currentProducts: Product[],
) {
	const features = await getFeatures(); // Get from AUTUMN
	const featureIds = features.map(feature => feature.id);
	const currentFeatureIds = currentFeatures.map(feature => feature.id);
	const featuresToDelete = featureIds.filter(
		featureId => !currentFeatureIds.includes(featureId),
	);

	const products = await getAllProducts();
	const productIds = products.map(product => product.id);
	const currentProductIds = currentProducts.map(product => product.id);
	const productsToDelete = productIds.filter(
		productId => !currentProductIds.includes(productId),
	);

	return {featuresToDelete, productsToDelete};
}

export async function upsertFeature(feature: Feature) {
	try {
		const response = await request('POST', `/features`, {
			...feature,
			config: {
				filters: [{property: '', operator: '', value: []}],
				usage_type: 'single_use',
			},
		});
		return response.data;
	} catch (error) {
		// If the first request fails, try posting to the specific feature ID endpoint
		const response = await request('POST', `/features/${feature.id}`, {
			...feature,
			config: {
				filters: [{property: '', operator: '', value: []}],
				usage_type: 'single_use',
			},
		});
		return response.data;
	}
}

export async function upsertProduct(product: Product) {
	try {
		const response = await request('POST', `/products`, product);
		return response.data;
	} catch (error) {
		// If the first request fails, try posting to the specific product ID endpoint
		const response = await request('POST', `/products/${product.id}`, product);
		return response.data;
	}
}
