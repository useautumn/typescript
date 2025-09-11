import { confirm } from "@inquirer/prompts";
import chalk from "chalk";
import yoctoSpinner from "yocto-spinner";
import type { Feature, Product } from "../compose/index.js";
import { FRONTEND_URL } from "../constants.js";
import { deleteFeature, deleteProduct } from "../core/api.js";
import {
	checkForDeletables,
	checkProductForConfirmation,
	upsertFeature,
	upsertProduct,
} from "../core/push.js";
import { initSpinner } from "../core/utils.js";

const spinner = (message?: string) => {
	const spinner = yoctoSpinner({
		text: message ?? "",
	});
	spinner.start();

	return spinner;
};

export default async function Push({
	config,
	yes,
	prod,
}: {
	config: {
		features: Feature[];
		products: Product[];
		env: string;
	};
	yes: boolean;
	prod: boolean;
}) {
	const { features, products, env } = config;

	if (env === "prod") {
		const shouldProceed = await confirm({
			message:
				"You are about to push products to your prod environment. Are you sure you want to proceed?",
			default: false,
		});
		if (!shouldProceed) {
			console.log(chalk.yellow("Aborting..."));
			process.exit(1);
		}
	}

	const { curProducts, featuresToDelete, productsToDelete } =
		await checkForDeletables(features, products);

	for (const productId of productsToDelete) {
		const shouldDelete =
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

	const batchFeatures = [];
	const s = initSpinner(`Pushing features`);
	for (const feature of features) {
		batchFeatures.push(upsertFeature(feature, s));
	}
	await Promise.all(batchFeatures);
	s.success(`Features pushed successfully!`);
	console.log(chalk.dim("\nFeatures pushed:"));
	features.forEach((feature: Feature) => {
		console.log(chalk.cyan(`  • ${feature.id}`));
	});
	console.log(); // Empty line for spacing

	// Handle confirmations sequentially first

	const productDecisions = new Map();
	const batchCheckProducts = [];
	for (const product of products) {
		batchCheckProducts.push(
			checkProductForConfirmation({
				curProducts,
				product,
			}),
		);
	}

	const checkProductResults = await Promise.all(batchCheckProducts);
	for (const result of checkProductResults) {
		if (result.will_version) {
			const shouldUpdate = await confirm({
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
	for (const product of products) {
		const shouldUpdate = productDecisions.get(product.id);
		if(shouldUpdate) batchProducts.push(
			upsertProduct({ curProducts, product, spinner: s2, shouldUpdate }),
		);
	}
	const prodResults = await Promise.all(batchProducts);
	s2.success(`Products pushed successfully!`);
	console.log(chalk.dim("\nProducts pushed:"));
	prodResults.forEach((result: { id: string; action: string }) => {
		const action = result.action;
		console.log(
			chalk.cyan(
				`  • ${result.id} ${action === "skipped" ? `(${action})` : ""}`,
			),
		);
	});
	console.log(); // Empty line for spacing

	for (const featureId of featuresToDelete) {
		const shouldDelete =
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
