import fs from "node:fs";
import { confirm } from "@inquirer/prompts";
import chalk from "chalk";
import { nukeCustomers, nukeFeatures, nukeProducts } from "../core/nuke.js";
import {
	getAllProductVariants,
	getCustomers,
	getFeatures,
} from "../core/pull.js";
import { initSpinner, isSandboxKey, readFromEnv } from "../core/utils.js";
import Pull from "./pull.js";

export default async function Nuke() {
	const apiKey = readFromEnv(true);

	const isSandbox = await isSandboxKey(apiKey);

	if (isSandbox) {
		console.log(
			chalk.red(
				"This is a descructive action! Please confirm you want to proceed.",
			),
		);
		const shouldProceed = await confirm({
			message: `Are you sure you want to proceed? This will delete ${chalk.bgWhite(chalk.red("all"))} your ${chalk.bgWhite(chalk.red("products"))}, ${chalk.bgWhite(chalk.red("features"))} and ${chalk.bgWhite(chalk.red("customers"))} from your sandbox environment. You must confirm three times.`,
			default: false,
		});

		if (!shouldProceed) {
			console.log(chalk.red("Aborting..."));
			process.exit(1);
		}

		const secondConfirm = await confirm({
			message:
				"Are you still sure you want to proceed? You will get one more chance to confirm.",
			default: false,
		});

		if (!secondConfirm) {
			console.log(chalk.red("Aborting..."));
			process.exit(1);
		}

		const thirdConfirm = await confirm({
			message:
				"Are you still sure you want to proceed? This is your final chance.",
			default: false,
		});

		if (!thirdConfirm) {
			console.log(chalk.red("Aborting..."));
			process.exit(1);
		}

		const backupConfirm = await confirm({
			message: `Would you like to backup your ${chalk.bgMagentaBright(chalk.white("autumn.config.ts"))} file before proceeding? (Recommended)`,
			default: true,
		});

		if (backupConfirm) {
			fs.copyFileSync("autumn.config.ts", "autumn.config.ts.backup");
			console.log(chalk.green("Backup created successfully!"));
		}

		console.log(chalk.red("Nuking sandbox..."));

		const s = initSpinner(
			`Preparing ${chalk.bgWhite(chalk.red("customers"))}, ${chalk.bgWhite(chalk.red("features"))} and ${chalk.bgWhite(chalk.red("products"))} for deletion...`,
		);
		const products = await getAllProductVariants();
		const features = await getFeatures();
		const customers = await getCustomers();
		s.success(
			`Loaded all ${chalk.bgWhite(chalk.red("customers"))}, ${chalk.bgWhite(chalk.red("features"))} and ${chalk.bgWhite(chalk.red("products"))} for deletion`,
		);

		try {
			await nukeCustomers(customers);
			await nukeProducts(products.map((product: { id: string }) => product.id));
			await nukeFeatures(features.map((feature: { id: string }) => feature.id));
		} catch (e: unknown) {
			console.error(chalk.red("Failed to nuke sandbox:"));
			console.error(e);
			process.exit(1);
		}
		
		console.log(chalk.green("Sandbox nuked successfully!"));

		const pullNewConfig = await confirm({
			message: "Would you like to pull the new config file?",
			default: true,
		});

		if (pullNewConfig) {
			await Pull();
		} else process.exit(0);
	} else {
		console.log(chalk.red`You can't nuke a prod environment!`);
		process.exit(1);
	}
}
