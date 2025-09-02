import fs from "node:fs";
import { confirm } from "@inquirer/prompts";
import chalk from "chalk";
import dotenv from "dotenv";
import yoctoSpinner from "yocto-spinner";

export const notNullish = (value: unknown) => value !== null && value !== undefined;
export const nullish = (value: unknown) => value === null || value === undefined;

export function snakeCaseToCamelCase(value: string) {
	return value.replace(/_([a-z])/g, (_match, letter) => letter.toUpperCase());
}

export function idToVar(id: string): string {
	return id
		.replace(/[-_](.)/g, (_, letter) => letter.toUpperCase())
		.replace(/^[^a-zA-Z_$]/, "_") // Handle leading non-letter characters
		.replace(/[^a-zA-Z0-9_$]/g, ""); // Remove invalid JavaScript identifier characters
}

async function upsertEnvVar(
	filePath: string,
	varName: string,
	newValue: string,
) {
	const content = fs.readFileSync(filePath, "utf-8");
	const lines = content.split("\n");
	let found = false;

	for (let i = 0; i < lines.length; i++) {
		if (lines[i]?.startsWith(`${varName}=`)) {
			const shouldOverwrite = await confirm({
				message: `${varName} already exists in .env. Overwrite?`,
				default: false,
			});
			if (shouldOverwrite) {
				lines[i] = `${varName}=${newValue}`;
				found = true;
				break;
			}
		}
	}

	// If variable wasn't found, add it to the end
	if (!found) {
		lines.push(`${varName}=${newValue}`);
	}

	// Write the updated content back to the file
	fs.writeFileSync(filePath, lines.join("\n"));
}

export function storeToEnv(prodKey: string, sandboxKey: string) {
	const envPath = `${process.cwd()}/.env`;
	const envLocalPath = `${process.cwd()}/.env.local`;
	const envVars = `AUTUMN_PROD_SECRET_KEY=${prodKey}\nAUTUMN_SECRET_KEY=${sandboxKey}\n`;

	// Check if .env exists first
	if (fs.existsSync(envPath)) {
		upsertEnvVar(envPath, "AUTUMN_PROD_SECRET_KEY", prodKey);
		upsertEnvVar(envPath, "AUTUMN_SECRET_KEY", sandboxKey);
		console.log(chalk.green(".env file found. Updated keys."));
	} else if (fs.existsSync(envLocalPath)) {
		// If .env doesn't exist but .env.local does, create .env and write keys
		fs.writeFileSync(envPath, envVars);
		console.log(
			chalk.green(
				".env.local found but .env not found. Created new .env file and wrote keys.",
			),
		);
	} else {
		// Neither .env nor .env.local exists, create .env
		fs.writeFileSync(envPath, envVars);
		console.log(
			chalk.green(
				"No .env or .env.local file found. Created new .env file and wrote keys.",
			),
		);
	}
}

export function readFromEnv<T extends boolean = false>(
	errorOnNotFound?: T,
): T extends true ? string : string | undefined {
	const envPath = `${process.cwd()}/.env`;
	const envLocalPath = `${process.cwd()}/.env.local`;

	// Check .env first (has priority)
	if (fs.existsSync(envPath)) {
		const envContent = fs.readFileSync(envPath, "utf-8");
		const parsed = dotenv.parse(envContent);
		// biome-ignore lint/complexity/useLiteralKeys: will give an index signature error otherwise
		if (parsed["AUTUMN_SECRET_KEY"]) {
			// biome-ignore lint/complexity/useLiteralKeys: will give an index signature error otherwise
			return parsed["AUTUMN_SECRET_KEY"];
		}
	}

	// If not found in .env, check .env.local
	if (fs.existsSync(envLocalPath)) {
		const envContent = fs.readFileSync(envLocalPath, "utf-8");
		const parsed = dotenv.parse(envContent);
		// biome-ignore lint/complexity/useLiteralKeys: will give an index signature error otherwise
		if (parsed["AUTUMN_SECRET_KEY"]) {
			// biome-ignore lint/complexity/useLiteralKeys: will give an index signature error otherwise
			return parsed["AUTUMN_SECRET_KEY"];
		}
	}

	if (errorOnNotFound !== true) return undefined as T extends true ? string : string | undefined;
	else throw new Error("No API key found");
}

export function initSpinner(message: string) {
	const spinner = yoctoSpinner({
		text: message,
	});
	spinner.start();

	return spinner;
}

export async function isSandboxKey(apiKey: string) {
	const prefix = apiKey.split("am_sk_")[1]?.split("_")[0];

	if (prefix === "live") {
		return false;
	} else if (prefix === "test") return true;
	else throw new Error("Invalid API key");
}
