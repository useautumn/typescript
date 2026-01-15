import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import prettier from "prettier";
import { buildConfigFile } from "../../lib/transforms/index.js";
import type { Feature, Plan } from "../../../source/compose/models/index.js";

/**
 * Write autumn.config.ts file with formatting
 */
export async function writeConfig(
	features: Feature[],
	plans: Plan[],
	cwd: string = process.cwd(),
): Promise<string> {
	const configPath = resolve(cwd, "autumn.config.ts");

	// Generate code
	const code = buildConfigFile(features, plans);

	// Format with prettier
	let formattedCode: string;
	try {
		formattedCode = await prettier.format(code, {
			parser: "typescript",
			useTabs: true,
			singleQuote: true,
		});
	} catch (error) {
		// If formatting fails, use unformatted code
		console.warn("Failed to format config file:", error);
		formattedCode = code;
	}

	// Write file
	writeFileSync(configPath, formattedCode, "utf-8");

	return configPath;
}
