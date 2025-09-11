import chalk from 'chalk';
import {confirm} from '@inquirer/prompts';
import yoctoSpinner from 'yocto-spinner';

import {
	upsertProduct,
	checkForDeletables,
	upsertFeature,
	checkProductForConfirmation,
} from '../core/push.js';
import {deleteFeature, deleteProduct} from '../core/api.js';
import {FRONTEND_URL} from '../constants.js';
import {initSpinner} from '../core/utils.js';
import {Feature, product, Product} from '../compose/index.js';

const spinner = (message: string) => {
	const spinner = yoctoSpinner({
		text: message,
	});
	spinner.start();

	return spinner;
};

const isStdinPiped = () => {
	return !process.stdin.isTTY;
};

let stdinRead = false;
let cachedStdinInput = '';

const safeConfirm = async (options: {message: string; default?: boolean}) => {
	if (isStdinPiped()) {
		// Read stdin input only once and cache it
		if (!stdinRead) {
			cachedStdinInput = await new Promise<string>(resolve => {
				const onData = (chunk: Buffer) => {
					process.stdin.removeListener('data', onData);
					process.stdin.pause(); // Stop reading more data
					const chunkStr = chunk.toString();
					const [firstPiece = ''] = chunkStr.split('\n');
					const firstLine = firstPiece.trim();
					resolve(firstLine);
				};
				process.stdin.on('data', onData);

				// Handle case where stdin is already ended
				if (process.stdin.readableEnded) {
					resolve('');
				}
			});
			stdinRead = true;
		}

		const answer = cachedStdinInput.toLowerCase();
		const confirmed = answer === 'y' || answer === 'yes';
		console.log(
			chalk.yellow(
				`Piped input received: ${options.message} [${confirmed ? 'y' : 'n'}]`,
			),
		);
		return confirmed;
	}
	return await confirm(options);
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
	let {features, products, env} = config;

	if (env === 'prod') {
		const shouldProceed = await safeConfirm({
			message:
				'You are about to push products to your prod environment. Are you sure you want to proceed?',
			default: false,
		});
		if (!shouldProceed) {
			console.log(chalk.yellow('Aborting...'));
			process.exit(1);
		}
	}

	let {curFeatures, curProducts, featuresToDelete, productsToDelete} =
		await checkForDeletables(features, products);

	for (let productId of productsToDelete) {
		let shouldDelete =
			yes ||
			(await safeConfirm({
				message: `Delete product [${productId}]?`,
			}));
		if (shouldDelete) {
			const s = spinner(`Deleting product [${productId}]`);
			await deleteProduct(productId);
			s.success(`Product [${productId}] deleted successfully!`);
		}
	}

	const batchFeatures = [];
	const s = initSpinner(`Pushing features`);
	for (let feature of features) {
		batchFeatures.push(upsertFeature(feature, s));
	}
	await Promise.all(batchFeatures);
	s.success(`Features pushed successfully!`);
	console.log(chalk.dim('\nFeatures pushed:'));
	features.forEach((feature: Feature) => {
		console.log(chalk.cyan(`  • ${feature.id}`));
	});
	console.log(); // Empty line for spacing

	// Handle confirmations sequentially first

	const productDecisions = new Map();
	const batchCheckProducts = [];
	for (let product of products) {
		batchCheckProducts.push(
			checkProductForConfirmation({
				curProducts,
				product,
			}),
		);
	}

	const checkProductResults = await Promise.all(batchCheckProducts);
	for (let result of checkProductResults) {
		if (result.will_version) {
			const shouldUpdate = await safeConfirm({
				message: `Product ${result.id} has customers on it and updating it will create a new version.\nAre you sure you'd like to continue? `,
			});
			productDecisions.set(result.id, shouldUpdate);
		} else {
			productDecisions.set(result.id, true);
		}
	}

	// Now batch process all products with their decisions
	const s2 = initSpinner(`Pushing products`);
	const batchProducts = [];
	for (let product of products) {
		const shouldUpdate = productDecisions.get(product.id);
		batchProducts.push(
			upsertProduct({curProducts, product, spinner: s2, shouldUpdate}),
		);
	}
	const prodResults = await Promise.all(batchProducts);
	s2.success(`Products pushed successfully!`);
	console.log(chalk.dim('\nProducts pushed:'));
	prodResults.forEach((result: any) => {
		let action = result.action;
		console.log(
			chalk.cyan(
				`  • ${result.id} ${action == 'skipped' ? `(${action})` : ''}`,
			),
		);
	});
	console.log(); // Empty line for spacing

	for (let featureId of featuresToDelete) {
		let shouldDelete =
			yes ||
			(await safeConfirm({
				message: `Delete feature [${featureId}]?`,
			}));
		if (shouldDelete) {
			const s = spinner(`Deleting feature [${featureId}]`);
			await deleteFeature(featureId);
			s.success(`Feature [${featureId}] deleted successfully!`);
		}
	}

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
