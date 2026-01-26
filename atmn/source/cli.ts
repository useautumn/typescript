#!/usr/bin/env node
import chalk from 'chalk';
import {program} from 'commander';
import open from 'open';
import AuthCommand from '../src/commands/auth/command.js';
import {fetchOrganizationMe} from '../src/lib/api/endpoints/index.js';
import {testTemplateCommand} from '../src/commands/test-template.js';
import Init from './commands/init.js';
import Nuke from './commands/nuke.js';
import Pull from './commands/pull.js';
import Push from './commands/push.js';
import {DEFAULT_CONFIG, FRONTEND_URL} from './constants.js';
import {loadAutumnConfigFile, writeConfig} from './core/config.js';
import {readFromEnv} from './core/utils.js';

declare const VERSION: string;

// Guard against missing define in watch/incremental rebuilds
const computedVersion =
	typeof VERSION !== 'undefined' && VERSION ? VERSION : 'dev';

program.version(computedVersion);

program.option('-p, --prod', 'Push to production');
program.option('-l, --local', 'Use local autumn environment');

program
	.command('env')
	.description('Check the environment and organization info')
	.action(async () => {
		// Ensure API key is present
		const secretKey = readFromEnv();
		if (!secretKey) {
			console.error(chalk.red("No API key found. Run `atmn login` to authenticate."));
			process.exit(1);
		}
		
		// Fetch organization info from API
		const orgInfo = await fetchOrganizationMe({ secretKey });
		
		const envDisplay = orgInfo.env === 'sandbox' ? 'Sandbox' : 'Production';
		console.log(chalk.green(`Organization: ${orgInfo.name}`));
		console.log(chalk.green(`Slug: ${orgInfo.slug}`));
		console.log(chalk.green(`Environment: ${envDisplay}`));
	});

program
	.command('nuke')
	.description('Permannently nuke your sandbox.')
	.action(async () => {
		await Nuke();
	});

program
	.command('push')
	.description('Push changes to Autumn')
	.option('-p, --prod', 'Push to production')
	.option('-y, --yes', 'Confirm all deletions')
	.action(async options => {
		const config = await loadAutumnConfigFile();
		await Push({config, yes: options.yes, prod: options.prod});
	});

program
	.command('pull')
	.description('Pull changes from Autumn')
	.option('-p, --prod', 'Pull from production')
	.action(async options => {
		// if (options.archived)
		// 	console.warn(chalk.yellow('Warning: Including archived products'));
		await Pull({archived: options.archived ?? false});
	});
// .option('-a, --archived', 'Pull archived products')

program
	.command('init')
	.description('Initialize an Autumn project.')
	.action(async () => {
		writeConfig(DEFAULT_CONFIG); // just write an empty config to make the config file.
		await Init();
	});

program
	.command('login')
	.description('Authenticate with Autumn')
	.option('-p, --prod', 'Authenticate with production')
	.action(async () => {
		await AuthCommand();
	});

program
	.command('dashboard')
	.description('Open the Autumn dashboard in your browser')
	.action(() => {
		open(`${FRONTEND_URL}`);
	});

program
	.command('version')
	.alias('v')
	.description('Show the version of Autumn')
	.action(() => {
		console.log(computedVersion);
	});

program
	.command('test-template')
	.description('Test template selector UI (prototype)')
	.action(() => {
		testTemplateCommand();
	});

/**
 * This is a hack to silence the DeprecationWarning about url.parse()
 */

// biome-ignore lint/suspicious/noExplicitAny: expected
const originalEmit = process.emitWarning as any;
// biome-ignore lint/suspicious/noExplicitAny: expected
(process as any).emitWarning = (warning: any, ...args: any[]) => {
	const msg = typeof warning === 'string' ? warning : warning.message;

	if (msg.includes('url.parse()')) {
		return;
	}

	return originalEmit(warning, ...args);
};

program.parse();
