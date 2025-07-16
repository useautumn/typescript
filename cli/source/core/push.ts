import {Feature, Product} from 'autumn-js/compose';
import {externalRequest} from './api.js';
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
		const response = await externalRequest({
			method: 'POST',
			path: `/features`,
			data: feature,
			throwOnError: true,
			// data: {
			// 	...feature,
			// 	config: {
			// 		filters: [{property: '', operator: '', value: []}],
			// 		usage_type: 'single_use',
			// 	},
			// },
		});

		return response.data;
	} catch (error) {
		// If the first request fails, try posting to the specific feature ID endpoint
		const response = await externalRequest({
			method: 'POST',
			path: `/features/${feature.id}`,
			data: feature,

			// data: {
			// 	...feature,
			// 	config: {
			// 		filters: [{property: '', operator: '', value: []}],
			// 		usage_type: 'single_use',
			// 	},
			// },
		});
		return response.data;
	}
}

export async function upsertProduct(product: Product) {
	try {
		const response = await externalRequest({
			method: 'POST',
			path: `/products`,
			data: product,
			throwOnError: true,
		});
		return response.data;
	} catch (error) {
		// If the first request fails, try posting to the specific product ID endpoint
		const response = await externalRequest({
			method: 'POST',
			path: `/products/${product.id}`,
			data: product,
		});
		return response.data;
	}
}
