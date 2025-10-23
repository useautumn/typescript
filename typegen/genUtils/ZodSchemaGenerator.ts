import * as ts from "typescript";
import { writeFileSync } from "node:fs";

/**
 * Result of extracting a Zod schema from source
 */
export interface ExtractedZodSchema {
	/** The Zod schema code (e.g., "z.object({ ... })") */
	schemaCode: string;
	/** JSDoc comment attached to the schema */
	jsdoc: string | null;
	/** Field descriptions extracted from .meta() calls */
	metaDescriptions: Record<string, string>;
	/** Type name (inferred from schema name, e.g., "UpdatePlanParams" from "UpdatePlanParamsSchema") */
	typeName: string;
}

/**
 * Options for transforming a Zod schema
 */
export interface TransformOptions {
	/** Fields to omit from the schema */
	omitFields: string[];
	/** Fields to rename (oldName -> newName) */
	renameFields?: Record<string, string>;
	/** Additional fields to add to the schema */
	extendFields: Record<string, { zodType: string; description?: string }>;
	/** Whether to keep snake_case (true) or convert to camelCase (false) */
	keepCase: boolean;
}

/**
 * Extract a Zod schema from a TypeScript source file
 */
export function extractZodSchema(
	sourceFilePath: string,
	schemaName: string,
): ExtractedZodSchema {
	const program = ts.createProgram([sourceFilePath], {
		target: ts.ScriptTarget.ES2020,
		module: ts.ModuleKind.CommonJS,
		skipLibCheck: true,
		noResolve: true,
	});

	const sourceFile = program.getSourceFile(sourceFilePath);
	if (!sourceFile) {
		throw new Error(`Could not find source file: ${sourceFilePath}`);
	}

	// Find the schema declaration
	let schemaDeclaration: ts.VariableDeclaration | null = null;
	let jsdoc: string | null = null;

	function visit(node: ts.Node) {
		if (ts.isVariableStatement(node)) {
			// Extract JSDoc from the variable statement
			const jsDocNodes = (node as unknown as { jsDoc: ts.JSDoc[] }).jsDoc;
			if (jsDocNodes && jsDocNodes.length > 0) {
				const jsDoc = jsDocNodes[0];
				if (jsDoc?.comment) {
					if (typeof jsDoc.comment === "string") {
						jsdoc = jsDoc.comment.trim();
					} else if (Array.isArray(jsDoc.comment)) {
						jsdoc = jsDoc.comment
							.map((part: { text: string }) =>
								typeof part === "string" ? part : part.text,
							)
							.join("")
							.trim();
					}
				}
			}

			// Find the declaration
			node.declarationList.declarations.forEach((declaration) => {
				if (
					ts.isVariableDeclaration(declaration) &&
					declaration.name &&
					ts.isIdentifier(declaration.name) &&
					declaration.name.text === schemaName
				) {
					schemaDeclaration = declaration;
				}
			});
		}
		ts.forEachChild(node, visit);
	}

	visit(sourceFile);

	if (!schemaDeclaration || !schemaDeclaration.initializer) {
		throw new Error(`Schema ${schemaName} not found in ${sourceFilePath}`);
	}

	// Extract the schema code
	const schemaCode = schemaDeclaration.initializer.getText(sourceFile);

	// Validate that we got a schema
	if (!schemaCode || schemaCode.trim().length === 0) {
		throw new Error(`Schema ${schemaName} initializer is empty`);
	}

	// Extract .meta() descriptions
	const metaDescriptions = extractMetaDescriptions(schemaCode);

	// Infer type name (e.g., "UpdatePlanParamsSchema" -> "UpdatePlanParams")
	const typeName = schemaName.replace(/Schema$/, "");

	return {
		schemaCode,
		jsdoc,
		metaDescriptions,
		typeName,
	};
}

/**
 * Extract field descriptions from .meta() calls in Zod schema code
 * Handles nested fields (e.g., "price.amount", "reset.interval")
 */
export function extractMetaDescriptions(
	schemaCode: string,
): Record<string, string> {
	const descriptions: Record<string, string> = {};

	// Match top-level fields with .meta()
	const metaRegex =
		/(\w+):\s*z\.[^,}]+\.meta\(\s*\{\s*description:\s*["']([^"']+)["']/g;
	let match: RegExpExecArray | null;

	while ((match = metaRegex.exec(schemaCode)) !== null) {
		const fieldName = match[1];
		const description = match[2];
		if (fieldName && description) {
			descriptions[fieldName] = description;
		}
	}

	// Extract nested field descriptions by parsing object structures
	// Look for patterns like: fieldName: z.object({ nestedField: z.type().meta({...}) })
	const lines = schemaCode.split('\n');
	let currentPath: string[] = [];
	let braceDepth = 0;

	for (const line of lines) {
		const trimmed = line.trim();

		// Track object nesting
		if (trimmed.includes('.object({')) {
			const fieldMatch = trimmed.match(/(\w+):\s*z/);
			if (fieldMatch && fieldMatch[1]) {
				currentPath.push(fieldMatch[1]);
			}
		}

		// Track brace depth
		for (const char of trimmed) {
			if (char === '{') braceDepth++;
			if (char === '}') braceDepth--;
		}

		// Extract nested field .meta()
		const nestedMatch = trimmed.match(/(\w+):\s*z\.[^,}]+\.meta\(\s*\{\s*description:\s*["']([^"']+)["']/);
		if (nestedMatch && nestedMatch[1] && nestedMatch[2] && currentPath.length > 0) {
			const fullPath = [...currentPath, nestedMatch[1]].join('.');
			descriptions[fullPath] = nestedMatch[2];
		}

		// Pop path when closing object
		if (trimmed.includes('})') && braceDepth < currentPath.length) {
			currentPath.pop();
		}
	}

	return descriptions;
}

/**
 * Transform a Zod schema with field operations (omit, rename, extend)
 */
export function transformZodSchema(
	schemaCode: string,
	options: TransformOptions,
): string {
	// Extract the object definition from z.object({ ... })
	// We need to properly handle nested braces
	// Handle schemas that have newlines (z\n.object(  or z.object()
	const objectStartMatch = schemaCode.match(/z\s*\.object\s*\(/);
	if (!objectStartMatch) {
		throw new Error("Could not find z.object( in schema");
	}
	const objectStart = objectStartMatch.index ?? 0;

	// Find the matching closing brace
	let braceCount = 0;
	let inString = false;
	let stringChar = "";
	let objectBodyStart = -1;
	let objectBodyEnd = -1;

	// Start after the matched "z.object(" (or z\n.object()
	const searchStart = objectStart + objectStartMatch[0].length;

	for (let i = searchStart; i < schemaCode.length; i++) {
		const char = schemaCode[i];

		// Handle string boundaries
		if ((char === '"' || char === "'" || char === "`") && schemaCode[i - 1] !== "\\") {
			if (inString && char === stringChar) {
				inString = false;
				stringChar = "";
			} else if (!inString) {
				inString = true;
				stringChar = char;
			}
			continue;
		}

		if (inString) continue;

		if (char === "{") {
			if (braceCount === 0) {
				objectBodyStart = i + 1;
			}
			braceCount++;
		} else if (char === "}") {
			braceCount--;
			if (braceCount === 0) {
				objectBodyEnd = i;
				break;
			}
		}
	}

	if (objectBodyStart === -1 || objectBodyEnd === -1) {
		throw new Error("Could not parse Zod object schema - mismatched braces");
	}

	let objectBody = schemaCode.substring(objectBodyStart, objectBodyEnd);

	// Parse fields from the object body
	const fields = parseZodObjectFields(objectBody);

	// Apply transformations
	const transformedFields = fields
		.filter((field) => !options.omitFields.includes(field.name))
		.map((field) => {
			let fieldName = field.name;

			// Apply rename
			if (options.renameFields && options.renameFields[fieldName]) {
				fieldName = options.renameFields[fieldName] ?? fieldName;
			}

			// Apply case conversion if needed
			if (!options.keepCase) {
				fieldName = toCamelCase(fieldName);
			}

			// Fix indentation in zodType (replace leading spaces/tabs with proper indent)
			let zodType = field.zodType;
			// Remove leading whitespace from multi-line types and re-indent
			if (zodType.includes("\n")) {
				const lines = zodType.split("\n");
				zodType = lines.map((line, i) => {
					if (i === 0) return line.trim();
					return "    " + line.trim();
				}).join("\n");
			}

			return { ...field, name: fieldName, zodType };
		});

	// Add extended fields
	Object.entries(options.extendFields).forEach(([fieldName, config]) => {
		const finalFieldName = options.keepCase
			? fieldName
			: toCamelCase(fieldName);
		transformedFields.push({
			name: finalFieldName,
			zodType: config.zodType,
			description: config.description || null,
		});
	});

	// Reconstruct the schema
	const fieldStrings = transformedFields.map((field) => {
		if (field.description) {
			return `  /** ${field.description} */\n  ${field.name}: ${field.zodType}`;
		}
		return `  ${field.name}: ${field.zodType}`;
	});

	return `z.object({\n${fieldStrings.join(",\n")}\n})`;
}

/**
 * Parse Zod object fields from the object body string
 */
function parseZodObjectFields(
	objectBody: string,
): Array<{ name: string; zodType: string; description: string | null }> {
	const fields: Array<{
		name: string;
		zodType: string;
		description: string | null;
	}> = [];

	// Split by field definitions (looking for pattern: fieldName: zod_type,)
	const lines = objectBody.split("\n");
	let currentField: { name: string; zodType: string; lines: string[] } | null = null;
	let fieldDepth = 0; // Track depth AFTER seeing the field name

	for (let i = 0; i < lines.length; i++) {
		const line = lines[i] ?? "";
		const trimmed = line.trim();

		// Skip empty lines when not in a field
		if (trimmed.length === 0 && !currentField) continue;

		// Check if this is the start of a NEW top-level field
		const fieldMatch = trimmed.match(/^(\w+):\s*(.+)/);

		if (fieldMatch && !currentField) {
			// Start a new field
			currentField = {
				name: fieldMatch[1] ?? "",
				zodType: "",
				lines: [fieldMatch[2] ?? ""],
			};

			// Count depth in the first line
			const firstLine = fieldMatch[2] ?? "";
			for (const char of firstLine) {
				if (char === "{" || char === "(") fieldDepth++;
				if (char === "}" || char === ")") fieldDepth--;
			}
		} else if (currentField) {
			// We're continuing the current field
			currentField.lines.push(trimmed);

			// Update depth
			for (const char of trimmed) {
				if (char === "{" || char === "(") fieldDepth++;
				if (char === "}" || char === ")") fieldDepth--;
			}

			// Check if field is complete (depth back to 0 and line ends with comma or is the last)
			if (fieldDepth === 0) {
				// Field is complete - check if this line ends with comma or if next line is a new field
				const endsWithComma = trimmed.endsWith(",") || trimmed.endsWith("},") || trimmed.endsWith("),");
				const nextLine = lines[i + 1]?.trim() || "";
				const nextIsField = nextLine.match(/^(\w+):\s*/);

				if (endsWithComma || nextIsField || i === lines.length - 1) {
					// Save the field
					const zodType = currentField.lines.join("\n").trim().replace(/,\s*$/, "");
					fields.push({
						name: currentField.name,
						zodType,
						description: null,
					});
					currentField = null;
					fieldDepth = 0;
				}
			}
		}
	}

	// Save last field if exists
	if (currentField) {
		const zodType = currentField.lines.join("\n").trim().replace(/,\s*$/, "");
		fields.push({
			name: currentField.name,
			zodType,
			description: null,
		});
	}

	return fields;
}

/**
 * Convert snake_case to camelCase
 */
function toCamelCase(str: string): string {
	return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

/**
 * Generate a complete Zod schema file with JSDoc and type exports
 */
export function generateZodSchemaFile(
	schemaCode: string,
	typeName: string,
	outputPath: string,
	jsdoc: string | null,
	metaDescriptions: Record<string, string>,
): void {
	const schemaName = `${typeName}Schema`;

	// Build the file content
	let content = `// AUTO-GENERATED - DO NOT EDIT MANUALLY
// Generated from @autumn/shared schemas
// Run \`pnpm gen:atmn\` to regenerate

import { z } from "zod/v4";

`;

	// Add JSDoc if present
	if (jsdoc) {
		content += `/**
 * ${jsdoc.replace(/\*\//g, "* /")}
 */
`;
	}

	// Add the schema
	content += `export const ${schemaName} = ${schemaCode};

`;

	// Add type export
	content += `export type ${typeName} = z.infer<typeof ${schemaName}>;
`;

	writeFileSync(outputPath, content);
}

/**
 * Generate a TypeScript interface with JSDoc from meta descriptions
 * This is used for manual type definitions in discriminated unions
 */
export function generateTypeScriptInterfaceWithJSDoc(
	typeName: string,
	fields: Array<{
		name: string;
		type: string;
		description?: string;
		optional?: boolean;
	}>,
): string {
	const fieldStrings = fields.map((field) => {
		let result = "";
		if (field.description) {
			result += `  /** ${field.description} */\n`;
		}
		result += `  ${field.name}${field.optional ? "?" : ""}: ${field.type};`;
		return result;
	});

	return `export type ${typeName} = {\n${fieldStrings.join("\n\n")}\n};`;
}
