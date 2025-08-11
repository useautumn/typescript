import chalk from 'chalk';
import {getAllProducts, getFeatures} from '../core/pull.js';
import {productBuilder} from '../core/builders/products.js';
import {featureBuilder} from '../core/builders/features.js';
import {writeConfig} from '../core/config.js';
import {importBuilder} from '../core/builders/products.js';
import {Feature, Product} from '../compose/models/composeModels.js';

export default async function Pull() {
	console.log(chalk.green('Pulling products and features from Autumn...'));
	const products = await getAllProducts();
	const features = await getFeatures();

	const productSnippets = products.map((product: Product) =>
		productBuilder({product, features}),
	);
	const featureSnippets = features.map((feature: Feature) =>
		featureBuilder(feature),
	);
	const autumnConfig = `
${importBuilder()}

// Features${featureSnippets.join('\n')}

// Products${productSnippets.join('\n')}
	`;

	writeConfig(autumnConfig);
	console.log(chalk.green('Success! Config has been updated.'));
}
