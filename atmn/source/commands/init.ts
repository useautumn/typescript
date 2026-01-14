import chalk from "chalk";
import { readFromEnv } from "../core/utils.js";
import AuthCommand from "../../src/commands/auth/command.js";
import Pull from "./pull.js";

export default async function Init() {
	// Try to read API key from .env first
	let apiKey = readFromEnv();
	if (apiKey) {
		console.log(chalk.green("API key found. Pulling latest config..."));
		await Pull();
		console.log(
			chalk.green("Project initialized and config pulled successfully!"),
		);
		return;
	}

	// If not found, run authentication
	console.log(chalk.yellow("No API key found. Running authentication..."));
	await AuthCommand();
	// After authentication, try to read the key again
	apiKey = readFromEnv();
	if (apiKey) {
		await Pull();
		console.log(
			chalk.green(
				"Project initialized! You are now authenticated and config has been pulled.",
			),
		);
	} else {
		console.log(
			chalk.red(
				"Authentication did not yield an API key. Please check your setup.",
			),
		);
	}
}
