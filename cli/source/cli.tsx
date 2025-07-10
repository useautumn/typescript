#!/usr/bin/env node
import React from 'react';
import {program} from 'commander';
import {render} from 'ink';
import Init from './commands/init.js';
import {loadAutumnConfig} from './core/config.js';
import {Push} from './commands/push.js';
import {Pull} from './commands/pull.js';
import open from 'open';

program
	.command('push')
	.description('Push changes to the remote repository')
	.option('-p, --prod', 'Push to production')
	.action(async options => {
		const config = await loadAutumnConfig();

		process.env['AUTUMN_API_KEY'] = options.prod
			? config.auth.keys.prodKey
			: config.auth.keys.sandboxKey;
		render(<Push config={config} />);
	});

program
	.command('pull')
	.description('Pull changes from Autumn')
	.option('-p, --prod', 'Pull from production')
	.action(async options => {
		const config = await loadAutumnConfig();
		process.env['AUTUMN_API_KEY'] = options.prod
			? config.auth.keys.prodKey
			: config.auth.keys.sandboxKey;
		render(<Pull config={config} />);
	});

program
	.command('init')
	.description('Initialize an Autumn project.')
	.action(() => {
		render(<Init />);
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
