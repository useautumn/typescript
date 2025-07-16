import path from 'path';
import fs from 'fs';
import createJiti from 'jiti';
import {pathToFileURL} from 'url';
import {resolve} from 'path';
import {execSync} from 'child_process';
import chalk from 'chalk';
import {confirm, select} from '@inquirer/prompts';

function checkAtmnInstalled(): boolean {
	try {
		// Check if atmn is installed locally
		const packageJsonPath = path.join(process.cwd(), 'package.json');
		if (fs.existsSync(packageJsonPath)) {
			const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
			return !!(packageJson.dependencies?.atmn || packageJson.devDependencies?.atmn);
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
		message: 'The atmn package is not installed. Would you like to install it now?',
		default: true,
	});

	if (!shouldInstall) {
		console.log(chalk.yellow('Skipping installation. You can install atmn manually with your preferred package manager.'));
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
		
		const installCommand = packageManager === 'npm' 
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

export async function loadAutumnConfigFile() {
	const configPath = path.join(process.cwd(), 'autumn.config.ts');
	const absolutePath = resolve(configPath);
	const fileUrl = pathToFileURL(absolutePath).href;

	// Check if atmn is installed
	if (!checkAtmnInstalled()) {
		const installed = await installAtmn();
		if (!installed) {
			throw new Error('atmn package is required but not installed. Please install it manually.');
		}
	}

	// Dynamic import the TypeScript config file
	const jiti = createJiti(import.meta.url);
	const mod = await jiti.import(fileUrl);

	const def = (mod as any).default || mod;

	if (!def.products || !Array.isArray(def.products)) {
		throw new Error(
			'You must export a products field that is an array of products.',
		);
	}

	if (!def.features || !Array.isArray(def.features)) {
		throw new Error(
			'You must export a features field that is an array of products.',
		);
	}

	return def;
}

export function writeConfig(config: string) {
	const configPath = path.join(process.cwd(), 'autumn.config.ts');
	fs.writeFileSync(configPath, config);
}
