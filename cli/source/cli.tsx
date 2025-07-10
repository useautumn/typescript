#!/usr/bin/env node
import React from 'react';
import {program} from 'commander';
import {render} from 'ink';
import Init from './commands/init.js';
import {loadAutumnConfig} from './core/config.js';
import {Push} from './commands/push.js';
import {Pull} from './commands/pull.js';
import AuthCommand from './commands/auth.js';
import open from 'open';
import Conf from 'conf';

const autumnConfig = new Conf({
	projectName: 'autumn-cli',
});

program
	.command('push')
	.description('Push changes to the remote repository')
	.option('-p, --prod', 'Push to production')
	.action(async options => {
		const config = await loadAutumnConfig();

		let key = options.prod
			? autumnConfig.get('keys.prodKey')
			: autumnConfig.get('keys.sandboxKey');

		if (!key) {
			console.error(
				'No API key found. Please run `autumn auth` to authenticate.',
			);
			process.exit(1);
		}

		process.env['AUTUMN_API_KEY'] = key as string;
		render(<Push config={config} />);
	});

program
	.command('pull')
	.description('Pull changes from Autumn')
	.option('-p, --prod', 'Pull from production')
	.action(async options => {
		const config = await loadAutumnConfig();
		let key = options.prod
			? autumnConfig.get('keys.prodKey')
			: autumnConfig.get('keys.sandboxKey');

		if (!key) {
			console.error(
				'No API key found. Please run `autumn auth` to authenticate.',
			);
			process.exit(1);
		}

		process.env['AUTUMN_API_KEY'] = key as string;
		render(<Pull config={config} />);
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

program.parse();
