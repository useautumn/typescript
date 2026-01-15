#!/usr/bin/env node
import chalk from "chalk";
import clipboard from "clipboardy";
import { program } from "commander";
import { render } from "ink";
import open from "open";
import React from "react";
import Init from "../source/commands/init.js";
import Nuke from "../source/commands/nuke.js";
import Push from "../source/commands/push.js";
import { DEFAULT_CONFIG, FRONTEND_URL } from "../source/constants.js";
import { loadAutumnConfigFile, writeConfig } from "../source/core/config.js";
import { getOrgMe } from "../source/core/requests/orgRequests.js";
import { readFromEnv } from "../source/core/utils.js";
// Import existing commands from source/ (legacy - will migrate incrementally)
import AuthCommand from "./commands/auth/command.js";
import { pull as newPull } from "./commands/pull/pull.js"; // New pull implementation
import { QueryProvider } from "./lib/providers/index.js";
import { pricingPrompt } from "./prompts/pricing.js";
// Import Ink views
import App from "./views/App.js";
import { InitFlow } from "./views/react/init/InitFlow.js";
import { PullView } from "./views/react/pull/Pull.js";

declare const VERSION: string;

// Guard against missing define in watch/incremental rebuilds
const computedVersion =
	typeof VERSION !== "undefined" && VERSION ? VERSION : "dev";

program.version(computedVersion);

program.option("-p, --prod", "Push to production");
program.option("-l, --local", "Use local autumn environment");

// Demo command to test Ink rendering and TTY detection
program
	.command("demo")
	.description("Demo command to test Ink rendering")
	.action(() => {
		if (process.stdout.isTTY) {
			// Interactive mode - render Ink UI
			render(<App />);
		} else {
			// Non-TTY (agent mode) - plain text output
			console.log("atmn - Autumn CLI");
			console.log("Running in non-interactive mode (agent/CI)");
		}
	});

// === Existing commands (unchanged from source/cli.ts) ===

program
	.command("env")
	.description("Check the environment and organization info")
	.action(async () => {
		// Ensure API key is present
		readFromEnv();

		// Fetch organization info from API
		const orgInfo = await getOrgMe();

		const envDisplay = orgInfo.env === "sandbox" ? "Sandbox" : "Production";
		console.log(chalk.green(`Organization: ${orgInfo.name}`));
		console.log(chalk.green(`Slug: ${orgInfo.slug}`));
		console.log(chalk.green(`Environment: ${envDisplay}`));
	});

program
	.command("nuke")
	.description("Permanently nuke your sandbox.")
	.action(async () => {
		if (process.stdout.isTTY) {
			// Interactive mode - use new beautiful Ink UI
			const { NukeView } = await import("./views/react/nuke/NukeView.js");
			render(
				<QueryProvider>
					<NukeView />
				</QueryProvider>,
			);
		} else {
			// Non-TTY mode - use legacy command
			await Nuke();
		}
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
	.option("-p, --prod", "Pull from live/production")
	.action(async (options) => {
		// Import AppEnv here to avoid circular dependencies
		const { AppEnv } = await import("./lib/env/index.js");
		const environment = options.prod ? AppEnv.Live : AppEnv.Sandbox;

		if (process.stdout.isTTY) {
			// Interactive mode - use beautiful Ink UI
			render(
				<QueryProvider>
					<PullView
						environment={environment}
						onComplete={() => {
							process.exit(0);
						}}
					/>
				</QueryProvider>,
			);
		} else {
			// Non-TTY (CI/agent mode) - use plain text
			console.log(`Pulling plans and features from Autumn (${environment})...`);

			try {
				const result = await newPull({
					generateSdkTypes: true,
					cwd: process.cwd(),
					environment,
				});

				console.log(
					chalk.green(
						`✓ Pulled ${result.features.length} features, ${result.plans.length} plans from ${environment}`,
					),
				);
				if (result.sdkTypesPath) {
					console.log(
						chalk.green(`✓ Generated SDK types at: ${result.sdkTypesPath}`),
					);
				}
			} catch (error) {
				console.error(chalk.red("Error pulling from Autumn:"), error);
				process.exit(1);
			}
		}
	});

program
	.command("init")
	.description("Initialize an Autumn project.")
	.option("--headless", "Run in headless mode (no interactive prompts)")
	.action(async (options) => {
		// Override TTY detection if --headless flag is passed
		if (options.headless) {
			process.stdout.isTTY = false;
		}

		if (process.stdout.isTTY) {
			// Interactive mode - use new Ink-based init flow
			render(
				<QueryProvider>
					<InitFlow />
				</QueryProvider>,
			);
		} else {
			// Non-TTY (agent/CI mode) - use headless init flow
			const { HeadlessInitFlow } = await import(
				"./views/react/init/HeadlessInitFlow.js"
			);
			render(
				<QueryProvider>
					<HeadlessInitFlow />
				</QueryProvider>,
			);
		}
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
		console.log(computedVersion);
	});

program
	.command("pricing-builder")
	.description("Get the pricing design agent prompt")
	.action(async () => {
		if (process.stdout.isTTY) {
			await clipboard.write(pricingPrompt);
			console.log(
				chalk.green(
					"Prompt copied to clipboard! You can paste it into your preferred agent now.",
				),
			);
		} else {
			console.log(pricingPrompt);
		}
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
