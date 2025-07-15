#!/usr/bin/env node
import React from 'react';
import {program} from 'commander';
import {render} from 'ink';
import Init from './commands/init.js';
import {loadAutumnConfig} from './core/config.js';
import Push from './commands/push.js';
import Pull from './commands/pull.js';
import AuthCommand from './commands/auth.js';
import open from 'open';
import Conf from 'conf';
import chalk from 'chalk';

const autumnConfig = new Conf({
	projectName: 'atmn',
});

export const API_KEY_VAR = '__AUTUMN_API_KEY__';
const VERSION = "1.0.0b"

function getAuthKeys(prod: boolean) {
	let key = prod
		? autumnConfig.get('keys.prodKey')
		: autumnConfig.get('keys.sandboxKey');

	console.log(autumnConfig.get('keys'));

	if (!key) {
		console.error(
			'No API key found. Please run `npx atmn auth` to authenticate.',
		);
		process.exit(1);
	}

	return key;
}

program.command('clear').description('Clear the config').action(() => {
	autumnConfig.clear();
	console.log(chalk.green('Config cleared successfully.'));
});

program
	.command('push')
	.description('Push changes to the remote repository')
	.option('-p, --prod', 'Push to production')
	.option('-y, --yes', 'Confirm all deletions')
	.action(async options => {
		const config = await loadAutumnConfig();
		let key = getAuthKeys(options.prod);

		process.env[API_KEY_VAR] = key as string;
		await Push({config, yes: options.yes, prod: options.prod});
	});

program
	.command('pull')
	.description('Pull changes from Autumn')
	.option('-p, --prod', 'Pull from production')
	.action(async options => {
		const config = await loadAutumnConfig();
		let key = getAuthKeys(options.prod);

		process.env[API_KEY_VAR] = key as string;
		await Pull({config});
	});

program
	.command('init')
	.description('Initialize an Autumn project.')
	.action(() => {
		render(<Init />);
	});

program
	.command('auth')
	.description('Authenticate with Autumn')
	.option('-p, --prod', 'Authenticate with production')
	.action(async () => {
		await AuthCommand(autumnConfig);
	});

// program
// 	.command('config')
// 	.description('Show the current config')
// 	.action(async () => {
// 		const config = await loadAutumnConfig();
// 		console.log(config);
// 	});

program
	.command('dashboard')
	.description('Open the Autumn dashboard in your browser')
	.action(() => {
		open(`https://app.useautumn.com`);
	});

program
	.command('version')
	.description('Show the version of Autumn')
	.action(() => {
		console.log(chalk.green(`Autumn v${VERSION}`));
	});

program.parse();
