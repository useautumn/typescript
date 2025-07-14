import {
	getAllProducts,
	getFeatures,
} from '../core/pull.js';
import {productBuilder} from '../core/builders/products.js';
import {featureBuilder} from '../core/builders/features.js';
import {writeConfig} from '../core/config.js';
import {importBuilder, exportBuilder} from '../core/builders/products.js';
import {snakeCaseToCamelCase} from '../core/utils.js';
import chalk from "chalk";

export default async function Pull({config}: {config: any}) {
	const products = await getAllProducts();
	const features = await getFeatures();

	const productSnippets = products.map(product => productBuilder(product));
	const featureSnippets = features.map(feature => featureBuilder(feature));
	const autumnConfig = `
${importBuilder()}

// Features
${featureSnippets.join('\n')}

// Products
${productSnippets.join('\n')}

// Remember to update this when you make changes!
${exportBuilder(products.map(product => product.id), features.map(feature => snakeCaseToCamelCase(feature.id)))}
	`
	writeConfig(autumnConfig);

	console.log(chalk.green('Success! Config has been updated.'));
}
