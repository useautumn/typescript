import fs from 'node:fs';
import {confirm} from '@inquirer/prompts';
import chalk from 'chalk';
import {nukeCustomers, nukeFeatures, nukeProducts} from '../core/nuke.js';
import {getAllProducts, getCustomers, getFeatures} from '../core/pull.js';
import {initSpinner, isSandboxKey, readFromEnv} from '../core/utils.js';
import {getOrg} from '../core/requests/orgRequests.js';
import {Feature} from '../compose/models/composeModels.js';

interface NukeOptions {
	backup: boolean;
	deleteStripeCustomers: boolean;
}

async function promptAndConfirmNuke(orgName: string): Promise<NukeOptions> {
	// Ask about Stripe first so we can include it in the warning
	const deleteStripeCustomers = await confirm({
		message: `Also delete customers from your ${chalk.blueBright.bold('Stripe')} test account?`,
		default: false,
	});

	console.log('\n' + chalk.bgRed.white.bold('  DANGER: SANDBOX NUKE  '));
	console.log(
		chalk.red(
			`This is irreversible. You are about to permanently delete all data from the organization ` +
				chalk.redBright.bold(orgName) +
				`\n\n` +
				`Items to be deleted:` +
				`\n  • ` +
				chalk.yellowBright('customers') +
				`\n  • ` +
				chalk.yellowBright('features') +
				`\n  • ` +
				chalk.yellowBright('products') +
				(deleteStripeCustomers
					? `\n  • ` + chalk.blueBright.bold('Stripe customers')
					: '') +
				`\n`,
		),
	);

	const shouldProceed = await confirm({
		message: `Confirm to continue. This will delete ${chalk.redBright.bold('all')} your ${chalk.redBright.bold('products')}, ${chalk.redBright.bold('features')} and ${chalk.redBright.bold('customers')}${deleteStripeCustomers ? chalk.blueBright.bold(' (including Stripe)') : ''} from your sandbox environment. You will confirm twice.`,
		default: false,
	});

	if (!shouldProceed) {
		console.log(chalk.red('Aborting...'));
		process.exit(1);
	}

	const finalConfirm = await confirm({
		message:
			'Final confirmation: Are you absolutely sure? This action is irreversible.',
		default: false,
	});

	if (!finalConfirm) {
		console.log(chalk.red('Aborting...'));
		process.exit(1);
	}

	const backupConfirm = await confirm({
		message: `Would you like to backup your ${chalk.magentaBright.bold('autumn.config.ts')} file before proceeding? (Recommended)`,
		default: true,
	});

	return {
		backup: backupConfirm,
		deleteStripeCustomers,
	};
}

export default async function Nuke() {
	const apiKey = readFromEnv();
	const isSandbox = await isSandboxKey(apiKey!);

	if (isSandbox) {
		const org = await getOrg();
		const {backup, deleteStripeCustomers} = await promptAndConfirmNuke(org.name);

		if (backup) {
			fs.copyFileSync('autumn.config.ts', 'autumn.config.ts.backup');
			console.log(chalk.green('Backup created successfully!'));
		}

		console.log(chalk.red('Nuking sandbox...'));

		const s = initSpinner(
			`Preparing ${chalk.yellowBright('customers')}, ${chalk.yellowBright('features')} and ${chalk.yellowBright('products')} for deletion...`,
		);
		const products = await getAllProducts({archived: true});
		const features = await getFeatures();
		const customers = await getCustomers();

		s.success(
			`Loaded all ${chalk.yellowBright('customers')}, ${chalk.yellowBright('features')} and ${chalk.yellowBright('products')} for deletion`,
		);

		features.sort((a: Feature, b: Feature) => {
			if (a.type === 'credit_system') {
				return -1;
			}
			return 1;
		});

		try {
			await nukeCustomers(customers, deleteStripeCustomers);
			await nukeProducts(products.map((product: {id: string}) => product.id));
			await nukeFeatures(features.map((feature: {id: string}) => feature.id));
		} catch (e: unknown) {
			console.error(chalk.red('Failed to nuke sandbox:'));
			console.error(e);
			process.exit(1);
		}

		console.log(chalk.green('Sandbox nuked successfully!'));
	} else {
		console.log(chalk.red`You can't nuke a prod environment!`);
		process.exit(1);
	}
}
