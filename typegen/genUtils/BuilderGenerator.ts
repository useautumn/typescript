import { writeFileSync } from "node:fs";

/**
 * Configuration for generating a builder function
 */
export interface BuilderConfig {
	/** Builder function name (e.g., "plan", "feature") */
	builderName: string;
	/** Schema name to reference (e.g., "PlanSchema") */
	schemaName: string;
	/** Parameter type name (e.g., "Plan", "Feature") */
	paramType: string;
	/** Source file to extract JSDoc from (optional) */
	sourceFile?: string;
	/** Target file to write builder to */
	targetFile: string;
	/** Whether to include runtime validation (.parse()) */
	validationEnabled?: boolean;
	/** Custom JSDoc override */
	jsdocOverride?: string;
	/** Default values for fields (undefined -> default value) */
	defaults?: Record<string, string | number | boolean | null>;
}

/**
 * Generate builder function code with JSDoc
 */
export function generateBuilderFunction(config: BuilderConfig): string {
	const {
		builderName,
		paramType,
		schemaName,
		jsdocOverride,
		validationEnabled,
		defaults,
	} = config;

	// Determine input and return types
	let inputType = paramType;
	let inputTypeDeclaration = "";

	// If we have defaults, create a separate input type
	if (defaults && Object.keys(defaults).length > 0) {
		const inputTypeName = `${paramType}Input`;
		const defaultFields = Object.keys(defaults).map(f => `'${f}'`).join(" | ");

		inputTypeDeclaration = `type ${inputTypeName} = Omit<${paramType}, ${defaultFields}> & Partial<Pick<${paramType}, ${defaultFields}>>;\n\n`;
		inputType = inputTypeName;
	}

	// Use custom JSDoc or generate default
	const jsdoc =
		jsdocOverride ||
		`/**
 * Create a ${paramType.toLowerCase()} definition
 *
 * @param params - ${paramType} configuration
 * @returns ${paramType} object for use in autumn.config.ts
 */`;

	// Generate function body
	const validationLine = validationEnabled
		? `  ${schemaName}.parse(params);`
		: "";

	// Generate default value assignments
	let returnStatement = "params";
	if (defaults && Object.keys(defaults).length > 0) {
		const defaultAssignments = Object.entries(defaults)
			.map(([field, value]) => {
				const valueStr = typeof value === "string"
					? `"${value}"`
					: value === null
					? "null"
					: value;
				return `    ${field}: params.${field} ?? ${valueStr}`;
			})
			.join(",\n");

		returnStatement = `{\n    ...params,\n${defaultAssignments}\n  }`;
	}

	return `${inputTypeDeclaration}${jsdoc}
export const ${builderName} = (params: ${inputType}): ${paramType} => {
${validationLine ? validationLine + "\n" : ""}  return ${returnStatement};
};
`;
}

/**
 * Generate a complete builder functions file
 */
export function generateBuilderFunctionsFile(
	builderConfigs: BuilderConfig[],
	outputPath: string,
	imports: { typeName: string; from: string }[],
): void {
	// Generate file header
	let content = `// AUTO-GENERATED - DO NOT EDIT MANUALLY
// Generated from @autumn/shared schemas
// Run \`pnpm gen:atmn\` to regenerate

`;

	// Generate imports
	if (imports.length > 0) {
		const typeImports = imports
			.map((imp) => `import type { ${imp.typeName} } from "${imp.from}";`)
			.join("\n");
		content += `${typeImports}\n\n`;
	}

	// Generate each builder function
	const builderFunctions = builderConfigs
		.map((config) => generateBuilderFunction(config))
		.join("\n");

	content += builderFunctions;

	writeFileSync(outputPath, content);
}
