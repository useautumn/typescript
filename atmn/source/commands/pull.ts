import chalk from 'chalk';
import prettier from 'prettier';
import {getAllProducts, getFeatures} from '../core/pull.js';
import {productBuilder} from '../core/builders/productBuilder.js';
import {featureBuilder} from '../core/builders/featureBuilder.js';
import {writeConfig} from '../core/config.js';
import {importBuilder, exportBuilder} from '../core/builders/productBuilder.js';
import {snakeCaseToCamelCase} from '../core/utils.js';
import {Feature, Product} from '../compose/models/composeModels.js';

export default async function Pull(options?: {archived?: boolean}) {
	console.log(chalk.green('Pulling products and features from Autumn...'));
	const products = await getAllProducts(options?.archived ?? false);
	const features = await getFeatures();

	console.log(
		'Products: ',
		products.map((product: Product) => product.id),
	);

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

	const formattedConfig = await prettier.format(autumnConfig, {
		parser: 'typescript',
		useTabs: true,
		singleQuote: false,
	});

	writeConfig(formattedConfig);

	console.log(chalk.green('Success! Config has been updated.'));
}
