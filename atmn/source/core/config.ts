import path from 'path';
import fs from 'fs';
import createJiti from 'jiti';
import {pathToFileURL} from 'url';
import {resolve} from 'path';
import {execSync} from 'child_process';
import chalk from 'chalk';
import {confirm, select} from '@inquirer/prompts';
import {
	PlanSchema,
	type Plan,
	type FreeTrial,
} from '../compose/models/planModels.js';
import {
	FeatureSchema,
	type Feature,
} from '../compose/models/featureModels.js';
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

function isPlan(value: any): value is Plan {
	try {
		PlanSchema.strict().parse(value);
		return true;
	} catch (error) {
		return false;
	}
}

function isFeature(value: any): value is Feature {
	try {
		FeatureSchema.strict().parse(value);
		return true;
	} catch {
		return false;
	}
}

function detectObjectType(value: any): 'plan' | 'feature' | 'unknown' {
	if (value && typeof value === 'object') {
		if (value.features && Array.isArray(value.features)) {
			return 'plan';
		}
		if (value.type) {
			return 'feature';
		}
	}
	return 'unknown';
}

function getValidationError(schema: any, value: any): string {
	try {
		schema.parse(value);
		return '';
	} catch (error: any) {
		// Handle Zod error specifically
		if (error.name === 'ZodError' && error.issues) {
			const formattedErrors = error.issues.map((issue: any) => {
				const path = issue.path.length > 0 ? `${issue.path.join('.')}` : 'root';
				return `  • ${path}: ${issue.message}`;
			});
			return `\n${formattedErrors.join('\n')}`;
		}

		// Fallback for other error types
		if (error.errors && Array.isArray(error.errors)) {
			const formattedErrors = error.errors.map((e: any) => {
				const path =
					e.path && e.path.length > 0 ? `${e.path.join('.')}` : 'root';
				return `  • ${path}: ${e.message}`;
			});
			return `\n${formattedErrors.join('\n')}`;
		}

		return error.message || 'Unknown validation error';
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

	const plans: Plan[] = [];
	const features: Feature[] = [];

	// Check for old-style default export first
	const defaultExport = (mod as any).default;
	if (defaultExport && defaultExport.plans && defaultExport.features) {
		// Old format: default export with plans and features arrays
		if (Array.isArray(defaultExport.plans)) {
			plans.push(...defaultExport.plans);
		}
		if (Array.isArray(defaultExport.features)) {
			features.push(...defaultExport.features);
		}
	} else if (defaultExport && defaultExport.products && defaultExport.features) {
		// Legacy format: default export with products (backwards compatibility)
		console.warn(chalk.yellow('⚠️  Using legacy "products" export. Please migrate to "plans" export.'));
		if (Array.isArray(defaultExport.products)) {
			plans.push(...defaultExport.products);
		}
		if (Array.isArray(defaultExport.features)) {
			features.push(...defaultExport.features);
		}
	} else {
		// New format: individual named exports
		for (const [key, value] of Object.entries(mod as Record<string, any>)) {
			if (key === 'default') continue;

			if (isPlan(value)) {
				plans.push(value as Plan);
			} else if (isFeature(value)) {
				features.push(value as Feature);
			} else {
				// Object doesn't match either schema - provide helpful error
				const detectedType = detectObjectType(value);

				if (detectedType === 'plan') {
					const validationError = getValidationError(PlanSchema, value);
					console.error('\n' + chalk.red('❌ Invalid plan configuration'));
					console.error(chalk.yellow(`Plan: "${key}"`));
					console.error(chalk.red('Validation errors:') + validationError);
					process.exit(1);
				} else if (detectedType === 'feature') {
					const validationError = getValidationError(FeatureSchema, value);
					console.error('\n' + chalk.red('❌ Invalid feature configuration'));
					console.error(chalk.yellow(`Feature: "${key}"`));
					console.error(chalk.red('Validation errors:') + validationError);
					process.exit(1);
				} else {
					console.error('\n' + chalk.red('❌ Invalid object configuration'));
					console.error(chalk.yellow(`Object: "${key}"`));
					console.error(
						chalk.red('Error:') +
							" Object must be either a plan (with 'features' field) or feature (with 'type' field)",
					);
					process.exit(1);
				}
			}
		}
	}

	const secretKey = readFromEnv();
	if (secretKey?.includes('live')) {
		// Confirm with user whether they want to proceed with prod environment
		console.log(chalk.magentaBright('Running in production environment...'));
	} else {
		console.log(chalk.yellow('Running in sandbox environment...'));
	}

	return {
		plans,
		features,
		env: secretKey?.includes('live') ? 'prod' : 'sandbox',
	};
}

export function writeConfig(config: string) {
	const configPath = path.join(process.cwd(), 'autumn.config.ts');
	fs.writeFileSync(configPath, config);
}
