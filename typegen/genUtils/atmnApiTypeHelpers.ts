import { writeFileSync } from "fs";
import path from "path";
import { extractZodSchema } from "./ZodSchemaGenerator.js";

/**
 * Simple generator for raw API response types
 * Unlike atmnTypeHelpers.ts which transforms for SDK use, this preserves API structure
 */

export interface ApiTypeConfig {
	/** Schema name in source file (e.g., "ApiPlanSchema") */
	schemaName: string;
	/** Type name to export (e.g., "ApiPlan") */
	typeName: string;
	/** Source file path */
	sourceFile: string;
}

/**
 * Generate a simple API type file from a Zod schema
 */
export function generateApiTypeFile(
	config: ApiTypeConfig,
	outputFile: string,
): void {
	// For API types, we import and re-export from the server's shared types
	// This is simpler and ensures they stay in sync
	const serverPath = "/Users/amianthus/Documents/Code/Autumn OSS/sirtenzin-autumn/shared";
	const relativePath = path.relative(
		path.dirname(outputFile),
		config.sourceFile
	).replace(/\.ts$/, ".js");

	// Handle cases where the source type name differs from the exported type name
	// For example: ApiFeatureV1Schema in server -> ApiFeature in CLI
	const sourceTypeName = config.schemaName.replace(/Schema$/, "");
	const needsRename = sourceTypeName !== config.typeName;

	const content = needsRename
		? `// AUTO-GENERATED - DO NOT EDIT MANUALLY
// Generated from @autumn/shared API schemas
// Run typegen to regenerate

import type { ${sourceTypeName} } from "${relativePath}";

/**
 * ${config.typeName} - Raw API response type
 * Source: ${path.basename(config.sourceFile)}
 * 
 * This type matches the exact structure returned by the Autumn API.
 * Use transform functions in src/lib/transforms/apiToSdk to convert to SDK types.
 */
export type ${config.typeName} = ${sourceTypeName};
`
		: `// AUTO-GENERATED - DO NOT EDIT MANUALLY
// Generated from @autumn/shared API schemas
// Run typegen to regenerate

import type { ${config.typeName} } from "${relativePath}";

/**
 * ${config.typeName} - Raw API response type
 * Source: ${path.basename(config.sourceFile)}
 * 
 * This type matches the exact structure returned by the Autumn API.
 * Use transform functions in src/lib/transforms/apiToSdk to convert to SDK types.
 */
export type { ${config.typeName} };
`;

	writeFileSync(outputFile, content, "utf-8");
}

/**
 * Generate API types index file
 */
export function generateApiTypesIndex(
	configs: Array<{ typeName: string; outputFile: string }>,
	outputFile: string,
): void {
	const exports = configs
		.map(({ typeName, outputFile: configOutputFile }) => {
			const fileName = path.basename(configOutputFile, ".ts");
			return `export type { ${typeName} } from "./${fileName}.js";`;
		})
		.join("\n");

	const content = `// AUTO-GENERATED - DO NOT EDIT MANUALLY
// Re-exports for API types

${exports}
`;

	writeFileSync(outputFile, content, "utf-8");
}
