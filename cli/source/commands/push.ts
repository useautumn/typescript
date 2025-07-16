import chalk from 'chalk';
import {confirm} from '@inquirer/prompts';

import {
	upsertProduct,
	checkForDeletables,
	upsertFeature,
} from '../core/push.js';
import {deleteFeature, deleteProduct} from '../core/api.js';
import {FRONTEND_URL} from '../constants.js';

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
			await deleteProduct(productId);
			console.log(chalk.green(`Product [${productId}] deleted successfully!`));
		}
	}

	for (let feature of features) {
		console.log(chalk.green(`Pushing feature [${feature.id}]`));
		await upsertFeature(feature);
		console.log(chalk.green(`Pushed feature [${feature.id}]`));
	}
	for (let product of products) {
		console.log(chalk.green(`Pushing product [${product.id}]`));
		await upsertProduct(product);
		console.log(chalk.green(`Pushed product [${product.id}]`));
	}

	for (let featureId of featuresToDelete) {
		let shouldDelete =
			yes ||
			(await confirm({
				message: `Delete feature [${featureId}]?`,
			}));
		if (shouldDelete) {
			await deleteFeature(featureId);
			console.log(chalk.green(`Feature [${featureId}] deleted successfully!`));
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
