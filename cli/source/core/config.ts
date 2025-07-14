import path from 'path';
import {resolve} from 'path';
import fs from 'fs';
import {pathToFileURL} from 'url';
import createJiti from 'jiti';

export async function loadAutumnConfig() {
	const configPath = path.join(process.cwd(), 'autumn.config.ts');
	const absolutePath = resolve(configPath);
	const fileUrl = pathToFileURL(absolutePath).href;

	// Dynamic import the TypeScript config file
	const jiti = createJiti(import.meta.url);
	const mod = await jiti.import(fileUrl);

	return (mod as any).default || mod;
}

export function writeConfig(config: string) {
	const configPath = path.join(process.cwd(), '../autumn.config.ts');
	fs.writeFileSync(
		configPath,
		config,
	);
}
