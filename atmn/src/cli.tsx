#!/usr/bin/env node
/** biome-ignore-all lint/complexity/useLiteralKeys: necessary */
import chalk from "chalk";
import { program } from "commander";
import { render } from "ink";
import open from "open";
import React from "react";
import Nuke from "../source/commands/nuke.js";
import { getOrgMe } from "../source/core/requests/orgRequests.js";
// Import existing commands from source/ (legacy - will migrate incrementally)
import AuthCommand from "./commands/auth/command.js";
import { pull as newPull } from "./commands/pull/pull.js"; // New pull implementation
import { FRONTEND_URL } from "./constants.js";
import { isProd, setCliContext } from "./lib/env/cliContext.js";
import { readFromEnv } from "./lib/utils.js";
// Import Ink views
import { QueryProvider } from "./views/react/components/providers/QueryProvider.js";
import { InitFlow } from "./views/react/init/InitFlow.js";
import { PullView } from "./views/react/pull/Pull.js";

declare const VERSION: string;

// Guard against missing define in watch/incremental rebuilds
const computedVersion =
	typeof VERSION !== "undefined" && VERSION ? VERSION : "dev";

program.version(computedVersion);

// Global options - available for all commands
// These are orthogonal: -p controls env (sandbox vs live), -l controls API server (remote vs localhost)
// Combined as -lp: use live environment on localhost API server
program.option(
	"-p, --prod",
	"Use live/production environment (default: sandbox)",
);
program.option(
	"-l, --local",
	"Use localhost:8080 API server (default: api.useautumn.com)",
);
program.option("--headless", "Force non-interactive mode (for CI/agents)");

// Set CLI context before any command runs
// This allows combined flags like -lp to work correctly
program.hook("preAction", (thisCommand) => {
	const opts = thisCommand.opts();
	setCliContext({
		prod: opts["prod"] ?? false,
		local: opts["local"] ?? false,
	});

	// Override TTY detection if --headless flag is passed globally
	if (opts["headless"]) {
		process.stdout.isTTY = false;
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
		// Nuke is sandbox-only - panic if prod flag is passed
		if (isProd()) {
			console.error(
				chalk.red.bold(
					"\n  ERROR: nuke command is only available for sandbox!\n",
				),
			);
			console.error(
				chalk.red(
					"  The nuke command permanently deletes all data and cannot be used on production.",
				),
			);
			console.error(
				chalk.red("  Remove the -p/--prod flag to nuke your sandbox.\n"),
			);
			process.exit(1);
		}

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
	.option("-y, --yes", "Confirm all prompts automatically")
	.action(async (options) => {
		// Import AppEnv here to avoid circular dependencies
		const { AppEnv } = await import("./lib/env/index.js");
		const environment = isProd() ? AppEnv.Live : AppEnv.Sandbox;

		if (process.stdout.isTTY) {
			// Interactive mode - use new beautiful Ink UI
			const { PushView } = await import("./views/react/push/Push.js");
			render(
				<QueryProvider>
					<PushView
						environment={environment}
						yes={options.yes}
						onComplete={() => {
							process.exit(0);
						}}
					/>
				</QueryProvider>,
			);
		} else {
			// Non-TTY mode - use headless push with V2 logic
			const { headlessPush } = await import("./commands/push/headless.js");
			await headlessPush({
				cwd: process.cwd(),
				environment,
				yes: options.yes,
			});
		}
	});

program
	.command("pull")
	.description("Pull changes from Autumn")
	.action(async () => {
		// Import AppEnv here to avoid circular dependencies
		const { AppEnv } = await import("./lib/env/index.js");
		const environment = isProd() ? AppEnv.Live : AppEnv.Sandbox;

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
	.action(async () => {
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
	.action(async () => {
		if (process.stdout.isTTY) {
			// Interactive mode - use new beautiful Ink UI
			const { LoginView } = await import("./views/react/login/LoginView.js");
			render(
				<QueryProvider>
					<LoginView
						onComplete={() => {
							process.exit(0);
						}}
					/>
				</QueryProvider>,
			);
		} else {
			// Non-TTY mode - use legacy command with URL fallback
			await AuthCommand();
		}
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
	.command("customers")
	.description("Browse and inspect customers")
	.action(async () => {
		const { customersCommand } = await import("./commands/customers/index.js");
		await customersCommand({ prod: isProd() });
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
