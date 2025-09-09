#!/usr/bin/env node
import chalk from "chalk";
import { program } from "commander";
import open from "open";
import AuthCommand from "./commands/auth.js";
import Init from "./commands/init.js";
import Nuke from "./commands/nuke.js";
import Pull from "./commands/pull.js";
import Push from "./commands/push.js";
import { DEFAULT_CONFIG, FRONTEND_URL } from "./constants.js";
import { loadAutumnConfigFile, writeConfig } from "./core/config.js";
import { isSandboxKey, readFromEnv } from "./core/utils.js";

declare const VERSION: string;

program.version(VERSION);

program.option('-p, --prod', 'Push to production');

program
	.command("env")
	.description("Check the environment of your API key")
	.action(async () => {
		const env = await isSandboxKey(readFromEnv() ?? "");
		console.log(chalk.green(`Environment: ${env ? "Sandbox" : "Production"}`));
	});

program
	.command("nuke")
	.description("Permannently nuke your sandbox.")
	.action(async () => {
		await Nuke();
	});

program
	.command("push")
	.description("Push changes to Autumn")
	.option("-p, --prod", "Push to production")
	.option("-y, --yes", "Confirm all deletions")
	.action(async (options) => {
		const config = await loadAutumnConfigFile();
		await Push({ config, yes: options.yes, prod: options.prod });
	});

program
	.command("pull")
	.description("Pull changes from Autumn")
	.option("-p, --prod", "Pull from production")
	.option("-a, --archived", "Pull archived products")
	.action(async (options) => {
		if (options.archived)
			console.warn(chalk.yellow("Warning: Including archived products"));
		await Pull({ archived: options.archived ?? false });
	});

program
	.command("init")
	.description("Initialize an Autumn project.")
	.action(async () => {
		writeConfig(DEFAULT_CONFIG); // just write an empty config to make the config file.
		await Init();
	});

program
	.command("login")
	.description("Authenticate with Autumn")
	.option("-p, --prod", "Authenticate with production")
	.action(async () => {
		await AuthCommand();
	});

program
	.command("dashboard")
	.description("Open the Autumn dashboard in your browser")
	.action(() => {
		open(`${FRONTEND_URL}`);
	});

program
	.command("version")
	.alias("v")
	.description("Show the version of Autumn")
	.action(() => {
		console.log(VERSION);
	});

/**
 * This is a hack to silence the DeprecationWarning about url.parse()
 */

// biome-ignore lint/suspicious/noExplicitAny: expected
const originalEmit = process.emitWarning as any;
// biome-ignore lint/suspicious/noExplicitAny: expected
(process as any).emitWarning = (warning: any, ...args: any[]) => {
	const msg = typeof warning === "string" ? warning : warning.message;

	if (msg.includes("url.parse()")) {
		return;
	}

	return originalEmit(warning, ...args);
};

program.parse();
