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
	const products = await getAllProducts({archived: options?.archived ?? false});
	const features = await getFeatures({includeArchived: true});

	const productSnippets = products.map((product: Product) =>
		productBuilder({product, features}),
	);

	const featureSnippets = features
		.filter((feature: Feature) => !feature.archived)
		.map((feature: Feature) => featureBuilder(feature));

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
