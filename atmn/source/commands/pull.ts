import chalk from 'chalk';
import prettier from 'prettier';
import {getAllPlans, getFeatures} from '../core/pull.js';
import {planBuilder} from '../core/builders/planBuilder.js';
import {featureBuilder} from '../core/builders/featureBuilder.js';
import {writeConfig} from '../core/config.js';
import {importBuilder, exportBuilder} from '../core/builders/planBuilder.js';
import {snakeCaseToCamelCase} from '../core/utils.js';
import {transformProductV2ToPlan} from '../core/transformers/productV2ToPlan.js';
import {Feature} from '../compose/models/featureModels.js';
import {Plan} from '../compose/models/planModels.js';

export default async function Pull(options?: {archived?: boolean}) {
	console.log(chalk.green('Pulling plans and features from Autumn...'));
	const productsV2 = await getAllPlans({archived: options?.archived ?? false});
	const features = await getFeatures({includeArchived: true});

	// Transform Product V2 API response to Plan V1 format
	const plans = productsV2.map((productV2: any) => transformProductV2ToPlan(productV2));

	const planSnippets = plans.map((plan: Plan) =>
		planBuilder({plan, features}),
	);

	const featureSnippets = features
		.filter((feature: Feature) => !feature.archived)
		.map((feature: Feature) => featureBuilder(feature));

	const autumnConfig = `
${importBuilder()}

// Features${featureSnippets.join('\n')}

// Plans${planSnippets.join('\n')}
	`;

	const formattedConfig = await prettier.format(autumnConfig, {
		parser: 'typescript',
		useTabs: true,
		singleQuote: false,
	});

	writeConfig(formattedConfig);

	console.log(chalk.green('Success! Config has been updated.'));
}
