import { existsSync, readFileSync, writeFileSync } from "node:fs";
import type { HookConfig, HookGenerationConfig } from "../typeConfigs.js";

/**
 * Generates and injects JSDoc comments into React hook files
 */
export class HookGenerator {
	private readonly autumnJSPath: string;

	constructor(autumnJSPath: string) {
		this.autumnJSPath = autumnJSPath;
	}

	/**
	 * Generate hook documentation by injecting JSDoc into hook files
	 */
	async generateHookDocs(config: HookGenerationConfig): Promise<void> {
		console.log(`⚡ Generating ${config.hooks.length} hook documentation...`);

		let successCount = 0;
		let failCount = 0;

		for (const hookConfig of config.hooks) {
			try {
				await this.injectHookJSDoc(hookConfig);
				successCount++;
			} catch (error) {
				console.error(
					`❌ Failed to generate docs for ${hookConfig.name}:`,
					error,
				);
				failCount++;
			}
		}

		console.log(
			`✅ Generated ${successCount} hook docs${failCount > 0 ? `, ${failCount} failed` : ""}`,
		);
	}

	/**
	 * Inject JSDoc into a hook file
	 */
	private async injectHookJSDoc(config: HookConfig): Promise<void> {
		if (!existsSync(config.filePath)) {
			throw new Error(`Hook file not found: ${config.filePath}`);
		}

		// Read the current file content
		const fileContent = readFileSync(config.filePath, "utf-8");

		// Find the export statement
		const exportRegex = new RegExp(
			`export\\s+const\\s+${config.exportName}\\s*=`,
			"m",
		);
		const match = fileContent.match(exportRegex);

		if (!match) {
			throw new Error(
				`Could not find export for ${config.exportName} in ${config.filePath}`,
			);
		}

		const exportIndex = match.index!;

		// Check if there's already JSDoc before this export
		const beforeExport = fileContent.slice(0, exportIndex);
		const lines = beforeExport.split("\n");

		// Find if there's a JSDoc comment immediately before the export
		let jsDocStart = -1;
		let jsDocEnd = -1;

		for (let i = lines.length - 1; i >= 0; i--) {
			const line = lines[i]?.trim() ?? "";

			if (line === "") {
				// Empty line, keep looking
				continue;
			}

			if (line === "*/") {
				// Found end of JSDoc
				jsDocEnd = i;
			} else if (line.startsWith("/**") && jsDocEnd !== -1) {
				// Found start of JSDoc
				jsDocStart = i;
				break;
			} else if (!line.startsWith("*") && !line.startsWith("/**")) {
				// Found non-JSDoc content, stop looking
				break;
			}
		}

		// Build the new JSDoc comment
		const jsdocLines = config.jsdoc.split("\n");
		const formattedJSDoc = `/**\n${jsdocLines.map((line) => (line ? ` * ${line}` : " *")).join("\n")}\n */\n`;

		let newContent: string;

		if (jsDocStart !== -1 && jsDocEnd !== -1) {
			// Replace existing JSDoc
			const beforeJSDoc = lines.slice(0, jsDocStart).join("\n");
			const afterJSDoc = lines.slice(jsDocEnd + 1).join("\n");
			newContent =
				beforeJSDoc +
				"\n" +
				formattedJSDoc +
				afterJSDoc +
				fileContent.slice(exportIndex);
		} else {
			// Insert new JSDoc before export
			newContent =
				fileContent.slice(0, exportIndex) +
				formattedJSDoc +
				fileContent.slice(exportIndex);
		}

		// Write the updated content back
		writeFileSync(config.filePath, newContent, "utf-8");
	}
}
