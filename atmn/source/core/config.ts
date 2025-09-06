import path from 'path';
import fs from 'fs';
import createJiti from 'jiti';
import {pathToFileURL} from 'url';
import {resolve} from 'path';
import {execSync} from 'child_process';
import chalk from 'chalk';
import {confirm, select} from '@inquirer/prompts';
import {
	ProductSchema,
	FeatureSchema,
	type Product,
	type Feature,
} from '../compose/models/composeModels.js';
import {readFromEnv} from './utils.js';

function checkAtmnInstalled(): boolean {
	try {
		// Check if atmn is installed locally
		const packageJsonPath = path.join(process.cwd(), 'package.json');
		if (fs.existsSync(packageJsonPath)) {
			const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
			return !!(
				packageJson.dependencies?.atmn || packageJson.devDependencies?.atmn
			);
		}

		// Check if atmn can be resolved
		execSync('node -e "require.resolve(\'atmn\')"', {stdio: 'ignore'});
		return true;
	} catch {
		return false;
	}
}

async function installAtmn(): Promise<boolean> {
	const shouldInstall = await confirm({
		message:
			'The atmn package is not installed. Would you like to install it now?',
		default: true,
	});

	if (!shouldInstall) {
		console.log(
			chalk.yellow(
				'Skipping installation. You can install atmn manually with your preferred package manager.',
			),
		);
		return false;
	}

	const packageManager = await select({
		message: 'Which package manager would you like to use?',
		choices: [
			{name: 'npm', value: 'npm'},
			{name: 'pnpm', value: 'pnpm'},
			{name: 'bun', value: 'bun'},
		],
		default: 'npm',
	});

	try {
		console.log(chalk.blue(`Installing atmn with ${packageManager}...`));

		const installCommand =
			packageManager === 'npm'
				? 'npm install atmn'
				: packageManager === 'pnpm'
					? 'pnpm add atmn'
					: 'bun add atmn';

		execSync(installCommand, {stdio: 'inherit'});
		console.log(chalk.green('atmn installed successfully!'));
		return true;
	} catch (error) {
		console.error(chalk.red('Failed to install atmn:'), error);
		return false;
	}
}

function isProduct(value: any): value is Product {
	try {
		ProductSchema.parse(value);
		return true;
	} catch {
		return false;
	}
}

function isFeature(value: any): value is Feature {
	try {
		FeatureSchema.parse(value);
		return true;
	} catch {
		return false;
	}
}

export async function loadAutumnConfigFile() {
	const configPath = path.join(process.cwd(), 'autumn.config.ts');
	const absolutePath = resolve(configPath);
	const fileUrl = pathToFileURL(absolutePath).href;

	// Check if atmn is installed
	if (!checkAtmnInstalled()) {
		const installed = await installAtmn();
		if (!installed) {
			throw new Error(
				'atmn package is required but not installed. Please install it manually.',
			);
		}
	}

	// Dynamic import the TypeScript config file
	const jiti = createJiti(import.meta.url);
	const mod = await jiti.import(fileUrl);

	const products: Product[] = [];
	const features: Feature[] = [];

	// Check for old-style default export first
	const defaultExport = (mod as any).default;
	if (defaultExport && defaultExport.products && defaultExport.features) {
		// Old format: default export with products and features arrays
		if (Array.isArray(defaultExport.products)) {
			products.push(...defaultExport.products);
		}
		if (Array.isArray(defaultExport.features)) {
			features.push(...defaultExport.features);
		}
	} else {
		// New format: individual named exports
		for (const [key, value] of Object.entries(mod as Record<string, any>)) {
			if (key === 'default') continue;

			if (isProduct(value)) {
				products.push(value as Product);
			} else if (isFeature(value)) {
				features.push(value as Feature);
			}
		}
	}

	// if (products.length === 0) {
	// 	throw new Error('No valid products found in autumn.config.ts exports.');
	// }

	// if (features.length === 0) {
	// 	throw new Error('No valid features found in autumn.config.ts exports.');
	// }

	const secretKey = readFromEnv();
	if (secretKey?.includes('live')) {
		// Confirm with user whether they want to proceed with prod environment
		console.log(chalk.magentaBright('Running in production environment...'));
	} else {
		console.log(chalk.yellow('Running in sandbox environment...'));
	}

	return {
		products,
		features,
		env: secretKey?.includes('live') ? 'prod' : 'sandbox',
	};
}

export function writeConfig(config: string) {
	const configPath = path.join(process.cwd(), 'autumn.config.ts');
	fs.writeFileSync(configPath, config);
}
