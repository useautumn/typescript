import chalk from 'chalk';
import {confirm} from '@inquirer/prompts';
import yoctoSpinner from 'yocto-spinner';

import {
	upsertProduct,
	checkForDeletables,
	upsertFeature,
} from '../core/push.js';
import {deleteFeature, deleteProduct} from '../core/api.js';
import {FRONTEND_URL} from '../constants.js';

const spinner = (message: string) => {
	const spinner = yoctoSpinner({
		text: message
	});
	spinner.start();

	return spinner;
};

export default async function Push({
	config,
	yes,
	prod,
}: {
	config: any;
	yes: boolean;
	prod: boolean;
}) {
	let {features, products} = config;

	let {featuresToDelete, productsToDelete} = await checkForDeletables(
		features,
		products,
	);

	for (let productId of productsToDelete) {
		let shouldDelete =
			yes ||
			(await confirm({
				message: `Delete product [${productId}]?`,
			}));
		if (shouldDelete) {
			const s = spinner(`Deleting product [${productId}]`);
			await deleteProduct(productId);
			s.success(`Product [${productId}] deleted successfully!`);
		}
	}

	for (let feature of features) {
		const s = spinner(`Pushing feature [${feature.id}]`);
		await upsertFeature(feature);
		s.success(`Pushed feature [${feature.id}]`);
	}
	for (let product of products) {
		const s = spinner(`Pushing product [${product.id}]`);
		await upsertProduct(product);
		s.success(`Pushed product [${product.id}]`);
	}

	for (let featureId of featuresToDelete) {
		let shouldDelete =
			yes ||
			(await confirm({
				message: `Delete feature [${featureId}]?`,
			}));
		if (shouldDelete) {
			const s = spinner(`Deleting feature [${featureId}]`);
			await deleteFeature(featureId);
			s.success(`Feature [${featureId}] deleted successfully!`);
		}
	}

	const env = prod ? 'prod' : 'sandbox';
	console.log(
		chalk.magentaBright(`Success! Changes have been pushed to ${env}.`),
	);

	if (prod) {
		console.log(
			chalk.magentaBright(
				`You can view the products at ${FRONTEND_URL}/products`,
			),
		);
	} else {
		console.log(
			chalk.magentaBright(
				`You can view the products at ${FRONTEND_URL}/sandbox/products`,
			),
		);
	}
}
