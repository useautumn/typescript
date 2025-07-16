#!/usr/bin/env node
import {program} from 'commander';
import Init from './commands/init.js';
import {loadAutumnConfigFile} from './core/config.js';
import Push from './commands/push.js';
import Pull from './commands/pull.js';
import AuthCommand from './commands/auth.js';
import open from 'open';
import chalk from 'chalk';
import { writeConfig } from './core/config.js';
import {FRONTEND_URL} from './constants.js';
import { DEFAULT_CONFIG } from './constants.js';

const VERSION = '1.0.0b';

program
	.command('push')
	.description('Push changes to the remote repository')
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
	.action(async () => {
		const config = await loadAutumnConfigFile();
		await Pull({config});
	});

program
	.command('init')
	.description('Initialize an Autumn project.')
	.action(async () => {
		writeConfig(DEFAULT_CONFIG); // just write an empty config to make the config file.
		const config = await loadAutumnConfigFile();
		await Init({config});
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
	.description('Show the version of Autumn')
	.action(() => {
		console.log(chalk.green(`Autumn v${VERSION}`));
	});

program.parse();
