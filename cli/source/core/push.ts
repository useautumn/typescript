import {Feature, Product} from '../compose/index.js';
import {externalRequest} from './api.js';
import {getFeatures, getAllProducts} from './pull.js';

export async function checkForDeletables(
	currentFeatures: Feature[],
	currentProducts: Product[],
) {
	const features = await getFeatures(); // Get from AUTUMN
	const featureIds = features.map((feature: Feature) => feature.id);
	const currentFeatureIds = currentFeatures.map(feature => feature.id);
	const featuresToDelete = featureIds.filter(
		(featureId: string) => !currentFeatureIds.includes(featureId),
	);

	const products = await getAllProducts();
	const productIds = products.map((product: Product) => product.id);
	const currentProductIds = currentProducts.map(
		(product: Product) => product.id,
	);
	const productsToDelete = productIds.filter(
		(productId: string) => !currentProductIds.includes(productId),
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
		});

		return response.data;
	} catch (error: any) {
		if (
			error.response &&
			error.response.data &&
			error.response.data.code === 'duplicate_feature_id'
		) {
			const response = await externalRequest({
				method: 'POST',
				path: `/features/${feature.id}`,
				data: feature,
			});
			return response.data;
		}

		console.error(
			`\nFailed to push feature ${feature.id}: ${
				error.response?.data?.message || 'Unknown error'
			}`,
		);
		process.exit(1);
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
	} catch (error: any) {
		if (
			error.response &&
			error.response.data &&
			error.response.data.code === 'product_already_exists'
		) {
			// If the first request fails, try posting to the specific product ID endpoint
			const response = await externalRequest({
				method: 'POST',
				path: `/products/${product.id}`,
				data: product,
			});
			return response.data;
		}

		console.error(
			`\nFailed to push product ${product.id}: ${
				error.response?.data?.message || 'Unknown error'
			}`,
		);
		process.exit(1);
	}
}
