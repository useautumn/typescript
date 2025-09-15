import {confirm} from '@inquirer/prompts';
import chalk from 'chalk';
import dotenv from 'dotenv';
import fs from 'fs';
import yoctoSpinner from 'yocto-spinner';

export const notNullish = (value: unknown) =>
	value !== null && value !== undefined;
export const nullish = (value: unknown) =>
	value === null || value === undefined;

export const isProdFlag = () => {
	const prodFlag =
		process.argv.includes('--prod') || process.argv.includes('-p');
	return prodFlag;
};

export const isLocalFlag = () => {
	const localFlag =
		process.argv.includes('--local') || process.argv.includes('-l');

	return localFlag;
};

export function snakeCaseToCamelCase(value: string) {
	return value.replace(/_([a-z])/g, (_match, letter) => letter.toUpperCase());
}

export function idToVar({
	id,
	prefix = 'product',
}: {
	id: string;
	prefix?: string;
}): string {
	const processed = id
		.replace(/[-_](.)/g, (_, letter) => letter.toUpperCase())
		.replace(/[^a-zA-Z0-9_$]/g, ''); // Remove invalid JavaScript identifier characters

	// If the processed string starts with a number, add 'product' prefix
	if (/^[0-9]/.test(processed)) {
		return `${prefix}${processed}`;
	}

	// If it starts with other invalid characters, add 'product' prefix
	if (/^[^a-zA-Z_$]/.test(processed)) {
		return `${prefix}${processed}`;
	}

	return processed;
}

async function upsertEnvVar(
	filePath: string,
	varName: string,
	newValue: string,
) {
	const content = fs.readFileSync(filePath, 'utf-8');
	const lines = content.split('\n');
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
	fs.writeFileSync(filePath, lines.join('\n'));
}

export async function storeToEnv(prodKey: string, sandboxKey: string) {
	const envPath = `${process.cwd()}/.env`;
	const envLocalPath = `${process.cwd()}/.env.local`;
	const envVars = `AUTUMN_PROD_SECRET_KEY=${prodKey}\nAUTUMN_SECRET_KEY=${sandboxKey}\n`;

	// Check if .env exists first
	if (fs.existsSync(envPath)) {
		await upsertEnvVar(envPath, 'AUTUMN_PROD_SECRET_KEY', prodKey);
		await upsertEnvVar(envPath, 'AUTUMN_SECRET_KEY', sandboxKey);
		console.log(chalk.green('.env file found. Updated keys.'));
	} else if (fs.existsSync(envLocalPath)) {
		// If .env doesn't exist but .env.local does, create .env and write keys
		fs.writeFileSync(envPath, envVars);
		console.log(
			chalk.green(
				'.env.local found but .env not found. Created new .env file and wrote keys.',
			),
		);
	} else {
		// Neither .env nor .env.local exists, create .env
		fs.writeFileSync(envPath, envVars);
		console.log(
			chalk.green(
				'No .env or .env.local file found. Created new .env file and wrote keys.',
			),
		);
	}
}

function getEnvVar(parsed: {[key: string]: string}, prodFlag: boolean) {
	if (prodFlag) return parsed['AUTUMN_PROD_SECRET_KEY'];

	return parsed['AUTUMN_SECRET_KEY'];
}

export function readFromEnv(options?: {bypass?: boolean}) {
	const envPath = `${process.cwd()}/.env`;
	const envLocalPath = `${process.cwd()}/.env.local`;
	const prodFlag =
		process.argv.includes('--prod') || process.argv.includes('-p');

	// biome-ignore lint/complexity/useLiteralKeys: will throw "index signature" error otherwise
	if (prodFlag && process.env['AUTUMN_PROD_SECRET_KEY']) {
		return process.env['AUTUMN_PROD_SECRET_KEY'];
	}

	// biome-ignore lint/complexity/useLiteralKeys: will throw "index signature" error otherwise
	if (!prodFlag && process.env['AUTUMN_SECRET_KEY']) {
		return process.env['AUTUMN_SECRET_KEY'];
	}

	let secretKey = undefined;

	// Check .env second
	if (fs.existsSync(envPath))
		secretKey = getEnvVar(
			dotenv.parse(fs.readFileSync(envPath, 'utf-8')),
			prodFlag,
		);

	// If not found in .env, check .env.local
	if (fs.existsSync(envLocalPath))
		secretKey = getEnvVar(
			dotenv.parse(fs.readFileSync(envLocalPath, 'utf-8')),
			prodFlag,
		);

	if (!secretKey && !options?.bypass) {
		if (prodFlag) {
			console.error(
				'[Error] atmn uses the AUTUMN_PROD_SECRET_KEY to call the Autumn production API. Please add it to your .env file or run `atmn login` to authenticate.',
			);
			process.exit(1);
		} else {
			console.error(
				'[Error] atmn uses the AUTUMN_SECRET_KEY to call the Autumn sandbox API. Please add it to your .env (or .env.local) file or run `atmn login` to authenticate.',
			);
			process.exit(1);
		}
	}

	return secretKey;
}

export function initSpinner(message: string) {
	const spinner = yoctoSpinner({
		text: message,
	});
	spinner.start();

	return spinner;
}

export async function isSandboxKey(apiKey: string) {
	const prefix = apiKey.split('am_sk_')[1]?.split('_')[0];

	if (prefix === 'live') {
		return false;
	} else if (prefix === 'test') return true;
	else throw new Error('Invalid API key');
}
