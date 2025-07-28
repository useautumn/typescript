import {Spinner} from 'yocto-spinner';
import {Feature, Product} from '../compose/index.js';
import {externalRequest} from './api.js';
import {getFeatures, getAllProducts} from './pull.js';
import {confirm} from '@inquirer/prompts';
import {initSpinner} from './utils.js';
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

	return {
		curFeatures: features,
		curProducts: products,
		featuresToDelete,
		productsToDelete,
	};
}

const isDuplicate = (error: any) => {
	return (
		error.response &&
		error.response.data &&
		(error.response.data.code === 'duplicate_feature_id' ||
			error.response.data.code === 'product_already_exists')
	);
};

export async function upsertFeature(feature: Feature, s: Spinner) {
	// const s = initSpinner(`Pushing feature [${feature.id}]`);
	try {
		const response = await externalRequest({
			method: 'POST',
			path: `/features`,
			data: feature,
			throwOnError: true,
		});

		return response.data;
	} catch (error: any) {
		if (isDuplicate(error)) {
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
	} finally {
		// s.info(`Pushed feature [${feature.id}]`);
		s.text = `Pushed feature [${feature.id}]`;
		// s.success(`Pushed feature [${feature.id}]`);
		// console.log(`Pushed feature [${feature.id}]`);
	}
}

export async function checkProductForConfirmation({
	curProducts,
	product,
}: {
	curProducts: Product[];
	product: Product;
}) {
	let curProduct = curProducts.find(p => p.id === product.id);
	if (!curProduct) {
		// return { needsConfirmation: false, shouldUpdate: true };
		return {
			id: product.id,
			will_version: false,
		};
	}

	const res1 = await externalRequest({
		method: 'GET',
		path: `/products/${product.id}/has_customers`,
		data: product,
	});

	return {
		id: product.id,
		will_version: res1.will_version,
	};

	// const {will_version} = res1;

	// if (will_version) {
	// const shouldUpdate = await confirm({
	// 	message: `Product ${product.id} has customers on it and updating it will create a new version.\nAre you sure you'd like to continue? `,
	// });
	// return { needsConfirmation: true, shouldUpdate };
	// }

	// return { needsConfirmation: false, shouldUpdate: true };
}

export async function upsertProduct({
	curProducts,
	product,
	spinner,
	shouldUpdate = true,
}: {
	curProducts: Product[];
	product: Product;
	spinner: Spinner;
	shouldUpdate?: boolean;
}) {
	if (!shouldUpdate) {
		spinner.text = `Skipping update to product ${product.id}`;
		return {
			id: product.id,
			action: 'skipped',
		};
	}

	let curProduct = curProducts.find(p => p.id === product.id);
	if (!curProduct) {
		await externalRequest({
			method: 'POST',
			path: `/products`,
			data: product,
		});
		spinner.text = `Created product [${product.id}]`;
		return {
			id: product.id,
			action: 'create',
		};
	} else {
		await externalRequest({
			method: 'POST',
			path: `/products/${product.id}`,
			data: product,
		});

		spinner.text = `Updated product [${product.id}]`;
		return {
			id: product.id,
			action: 'updated',
		};
	}
	// try {
	// 	const response = await externalRequest({
	// 		method: 'POST',
	// 		path: `/products`,
	// 		data: product,
	// 		throwOnError: true,
	// 	});
	// 	spinner.success(`Pushed product [${product.id}]`);
	// } catch (error: any) {
	// 	if (isDuplicate(error)) {
	// 		const res1 = await externalRequest({
	// 			method: 'GET',
	// 			path: `/products/${product.id}/has_customers`,
	// 			data: product,
	// 		});

	// 		const {current_version, will_version} = res1;

	// 		let shouldUpdate = true;
	// 		if (will_version) {
	// 			spinner.stop();
	// 			// Clear the line to remove any spinner artifacts
	// 			process.stdout.write('\r\x1b[K');
	// 			shouldUpdate = await confirm({
	// 				message: `Product ${product.id} has customers on it and updating it will create a new version.\nAre you sure you'd like to continue? `,
	// 			});
	// 		}

	// 		if (shouldUpdate) {
	// 			// If the first request fails, try posting to the specific product ID endpoint
	// 			spinner.start();
	// 			const response = await externalRequest({
	// 				method: 'POST',
	// 				path: `/products/${product.id}`,
	// 				data: product,
	// 			});

	// 			spinner.success(`Pushed product [${product.id}]`);
	// 			return response;
	// 		} else {
	// 			spinner.info(`Skipping update to product ${product.id}`);
	// 			return;
	// 		}
	// 	}

	// 	console.error(
	// 		`\nFailed to push product ${product.id}: ${
	// 			error.response?.data?.message || 'Unknown error'
	// 		}`,
	// 	);
	// 	process.exit(1);
	// }
}
