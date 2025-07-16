import path from 'path';
import fs from 'fs';
import createJiti from 'jiti';
import {pathToFileURL} from 'url';
import {resolve} from 'path';

export async function loadAutumnConfigFile() {
	const configPath = path.join(process.cwd(), 'autumn.config.ts');
	const absolutePath = resolve(configPath);
	const fileUrl = pathToFileURL(absolutePath).href;

	// Dynamic import the TypeScript config file
	const jiti = createJiti(import.meta.url);
	const mod = await jiti.import(fileUrl);

	const def =  (mod as any).default || mod;

	if (!def.products || !Array.isArray(def.products)) {
		throw new Error("You must export a products field that is an array of products.")
	}

	if (!def.features || !Array.isArray(def.features)) {
		throw new Error("You must export a features field that is an array of products.");
	}

	return def;
}

export function writeConfig(config: string) {
	const configPath = path.join(process.cwd(), 'autumn.config.ts');
	fs.writeFileSync(
		configPath,
		config,
	);
}
