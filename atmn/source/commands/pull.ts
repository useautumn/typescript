import chalk from "chalk";
import * as prettier from "prettier";
import type { Feature, Product } from "../compose/models/composeModels.js";
import { featureBuilder } from "../core/builders/features.js";
import { importBuilder, productBuilder } from "../core/builders/products.js";
import { writeConfig } from "../core/config.js";
import { getAllProducts, getFeatures } from "../core/pull.js";

export default async function Pull(options?: { archived?: boolean }) {
	console.log(chalk.green("Pulling products and features from Autumn..."));
	const products = await getAllProducts(options?.archived ?? false);
	const features = await getFeatures();

	const productSnippets = products.map((product: Product) =>
		productBuilder({ product, features }),
	);
	const featureSnippets = features.map((feature: Feature) =>
		featureBuilder(feature),
	);
	const autumnConfig = `
${importBuilder()}

// Features${featureSnippets.join("\n")}

// Products${productSnippets.join("\n")}
	`;

	const formattedConfig = await prettier.format(autumnConfig, {
		parser: "typescript",
		useTabs: true,
		singleQuote: false,
	});

	writeConfig(formattedConfig);

	// 	// Remember to update this when you make changes!
	// ${exportBuilder(
	// 	products.map((product: Product) => product.id),
	// 	features.map((feature: Feature) => snakeCaseToCamelCase(feature.id)),
	// )}

	console.log(chalk.green("Success! Config has been updated."));
}
