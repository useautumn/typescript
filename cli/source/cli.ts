#!/usr/bin/env node
import {program} from 'commander';
import Init from './commands/init.js';
import {loadAutumnConfigFile} from './core/config.js';
import Push from './commands/push.js';
import Pull from './commands/pull.js';
import AuthCommand from './commands/auth.js';
import open from 'open';
import Conf from 'conf';
import chalk from 'chalk';

const autumnStore = new Conf({
	projectName: 'atmn',
});

export const API_KEY_VAR = '__AUTUMN_API_KEY__';
const VERSION = "1.0.0b"

function getAuthKeys(prod: boolean) {
	let key = prod
		? autumnStore.get('keys.prodKey')
		: autumnStore.get('keys.sandboxKey');

	console.log(autumnStore.get('keys'));

	if (!key) {
		console.error(
			'No API key found. Please run `npx atmn auth` to authenticate.',
		);
		process.exit(1);
	}

	return key;
}

program.command('clear').description('Clear the config').action(() => {
	autumnStore.clear();
	console.log(chalk.green('Config cleared successfully.'));
});

program
	.command('push')
	.description('Push changes to the remote repository')
	.option('-p, --prod', 'Push to production')
	.option('-y, --yes', 'Confirm all deletions')
	.action(async options => {
		const config = await loadAutumnConfigFile();
		let key = getAuthKeys(options.prod);

		process.env[API_KEY_VAR] = key as string;
		await Push({config, yes: options.yes, prod: options.prod});
	});

program
	.command('pull')
	.description('Pull changes from Autumn')
	.option('-p, --prod', 'Pull from production')
	.action(async options => {
		const config = await loadAutumnConfigFile();
		let key = getAuthKeys(options.prod);

		process.env[API_KEY_VAR] = key as string;
		await Pull({config});
	});

program
	.command('init')
	.description('Initialize an Autumn project.')
	.action(async () => {

		const config = await loadAutumnConfigFile();
		await Init({config, autumnStore});
	});

program
	.command('auth')
	.description('Authenticate with Autumn')
	.option('-p, --prod', 'Authenticate with production')
	.action(async () => {
		await AuthCommand(autumnStore);
	});

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
