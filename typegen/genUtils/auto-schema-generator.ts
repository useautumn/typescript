import { writeFileSync } from "node:fs";
import * as ts from "typescript";

interface GenerateZodOptions {
	inputFile: string;
	typeName: string;
	outputFile: string;
	camelCase?: boolean;
}

/**
 * Generate camelCase Zod schema from TypeScript interface
 */
export function generateCamelZod(
	options: GenerateZodOptions & {
		omitFields?: string[];
		extendFields?: Record<string, { zodType: string; description?: string }>;
	},
) {
	return generateCleanZodSchema(
		options.inputFile,
		options.typeName,
		options.outputFile,
		options.camelCase ?? true,
		options.omitFields ?? [],
		options.extendFields ?? {},
	);
}

/**
 * Automatically generate clean Zod schemas from TypeScript interfaces
 * This avoids the nested type reference issues from ts-to-zod
 */
// Cache TypeScript programs to avoid recompilation
const programCache = new Map<
	string,
	{ program: ts.Program; sourceFile: ts.SourceFile }
>();

function getOrCreateProgram(sourceFilePath: string) {
	if (programCache.has(sourceFilePath)) {
		return programCache.get(sourceFilePath)!;
	}

	const program = ts.createProgram([sourceFilePath], {
		target: ts.ScriptTarget.ES2020,
		module: ts.ModuleKind.CommonJS,
		skipLibCheck: true, // Skip type checking for faster parsing
		noResolve: true, // Don't resolve module imports
	});

	const sourceFile = program.getSourceFile(sourceFilePath);
	if (!sourceFile) {
		throw new Error(`Could not find source file: ${sourceFilePath}`);
	}

	const cached = { program, sourceFile };
	programCache.set(sourceFilePath, cached);
	return cached;
}

export function generateCleanZodSchema(
	sourceFilePath: string,
	interfaceName: string,
	outputFilePath: string,
	camelCase = false,
	omitFields: string[] = [],
	extendFields: Record<string, { zodType: string; description?: string }> = {},
) {
	const { sourceFile } = getOrCreateProgram(sourceFilePath);

	const interfaceDeclaration = findInterface(sourceFile, interfaceName);
	if (!interfaceDeclaration) {
		throw new Error(`Interface ${interfaceName} not found`);
	}

	// Find all nested interfaces and namespaces
	const nestedInterfaces = findNestedInterfaces(sourceFile, interfaceName);

	// Generate schemas for nested interfaces first
	const nestedSchemas = nestedInterfaces
		.map((nested) => {
			const schemaCode = generateSchemaCode(
				nested.interface,
				sourceFile,
				camelCase,
				nested.name,
			);
			// Convert "CheckoutParamsOption" to "CheckoutParamsOptionSchema" (PascalCase)
			const schemaName = `${nested.name}Schema`;
			return `export const ${schemaName} = ${schemaCode};`;
		})
		.join("\n\n");

	// Extract JSDoc comment for the main interface
	const interfaceDescription = extractJSDocComment(
		interfaceDeclaration,
		sourceFile,
	);

	const schemaCode = generateSchemaCode(
		interfaceDeclaration,
		sourceFile,
		camelCase,
		interfaceName,
		nestedInterfaces.map((n) => n.name),
		omitFields,
		extendFields,
	);

	// Add description to the main schema if available
	const finalSchemaCode = interfaceDescription
		? `${schemaCode}.describe("${interfaceDescription.replace(/"/g, '\\"')}")`
		: schemaCode;

	// Check if we need imports for external schemas
	const needsCustomerDataImport =
		finalSchemaCode.includes("CustomerDataSchema") ||
		nestedSchemas.includes("CustomerDataSchema");
	const needsEntityDataImport =
		finalSchemaCode.includes("EntityDataSchema") ||
		nestedSchemas.includes("EntityDataSchema");

	// Generate imports
	let imports = `import { z } from "zod";`;
	if (needsCustomerDataImport) {
		imports += `\nimport { CustomerDataSchema } from "./customerDataTypes";`;
	}
	if (needsEntityDataImport) {
		imports += `\nimport { EntityDataSchema } from "./entityDataTypes";`;
	}

	// Generate type imports for interfaces
	let typeImports = "";
	if (needsCustomerDataImport) {
		typeImports += `import type { CustomerData } from "./customerDataTypes";\n`;
	}
	if (needsEntityDataImport) {
		typeImports += `import type { EntityData } from "./entityDataTypes";\n`;
	}

	// Generate explicit interface with JSDoc comments
	const explicitInterface = generateExplicitInterface(
		interfaceDeclaration,
		sourceFile,
		camelCase,
		interfaceName,
		nestedInterfaces.map((n) => n.name),
		omitFields,
		extendFields,
		interfaceDescription,
	);

	// Generate nested interfaces
	const nestedInterfaces_generated = nestedInterfaces
		.map((nested) => {
			return generateExplicitInterface(
				nested.interface,
				sourceFile,
				camelCase,
				nested.name,
				[],
				[],
				{},
				null,
			);
		})
		.join("\n\n");

	const fullCode = `// Auto-generated Zod schema
${imports}
${typeImports}
${nestedSchemas ? `${nestedSchemas}\n\n` : ""}export const ${camelCase ? toCamelCase(interfaceName) : interfaceName.toLowerCase()}Schema = ${finalSchemaCode};

${nestedInterfaces_generated ? `${nestedInterfaces_generated}\n\n` : ""}${explicitInterface}
`;

	writeFileSync(outputFilePath, fullCode);
	return fullCode;
}

function findInterface(
	sourceFile: ts.SourceFile,
	interfaceName: string,
): ts.InterfaceDeclaration | undefined {
	let result: ts.InterfaceDeclaration | undefined;

	function visit(node: ts.Node) {
		if (ts.isInterfaceDeclaration(node) && node.name.text === interfaceName) {
			result = node;
			return;
		}
		ts.forEachChild(node, visit);
	}

	visit(sourceFile);
	return result;
}

function findNestedInterfaces(
	sourceFile: ts.SourceFile,
	parentInterfaceName: string,
): { name: string; interface: ts.InterfaceDeclaration }[] {
	const results: { name: string; interface: ts.InterfaceDeclaration }[] = [];

	function visit(node: ts.Node) {
		// Look for namespace declarations that match our parent interface name
		if (
			ts.isModuleDeclaration(node) &&
			node.name &&
			ts.isIdentifier(node.name) &&
			node.name.text === parentInterfaceName &&
			node.body &&
			ts.isModuleBlock(node.body)
		) {
			// Find interfaces within this namespace
			node.body.statements.forEach((statement) => {
				if (ts.isInterfaceDeclaration(statement)) {
					const nestedName = `${parentInterfaceName}${statement.name.text}`;
					results.push({
						name: nestedName,
						interface: statement,
					});
				}
			});
		}
		ts.forEachChild(node, visit);
	}

	visit(sourceFile);
	return results;
}

function generateSchemaCode(
	interfaceDecl: ts.InterfaceDeclaration,
	sourceFile: ts.SourceFile,
	camelCase: boolean,
	interfaceName?: string,
	availableNestedTypes?: string[],
	omitFields: string[] = [],
	extendFields: Record<string, { zodType: string; description?: string }> = {},
): string {
	const properties: string[] = [];

	interfaceDecl.members.forEach((member) => {
		if (ts.isPropertySignature(member)) {
			const propertyName = member.name?.getText(sourceFile);
			const isOptional = member.questionToken !== undefined;
			const typeNode = member.type;

			if (propertyName && typeNode) {
				const finalPropertyName = camelCase
					? toCamelCase(propertyName)
					: propertyName;

				// Check if this field should be omitted
				if (omitFields.includes(propertyName)) {
					return; // Skip this property
				}

				const zodType = convertTypeToZod(
					typeNode,
					sourceFile,
					interfaceName,
					availableNestedTypes,
				);

				// Extract JSDoc comment for this property
				const description = extractJSDocComment(member, sourceFile);

				// Debug logging (remove in production)
				if (process.env.DEBUG_JSDOC) {
					console.log(
						`Property ${propertyName}: ${description || "No description found"}`,
					);
				}

				// Build the Zod property with description
				let zodProperty = description
					? `${zodType}.describe("${escapeDescription(description)}")`
					: zodType;

				zodProperty = isOptional
					? `${finalPropertyName}: ${zodProperty}.optional()`
					: `${finalPropertyName}: ${zodProperty}`;
				properties.push(zodProperty);
			}
		}
	});

	// Add extended fields
	Object.entries(extendFields).forEach(([fieldName, config]) => {
		const finalFieldName = camelCase ? toCamelCase(fieldName) : fieldName;

		const zodProperty = config.description
			? `${config.zodType}.describe("${escapeDescription(config.description)}")`
			: config.zodType;

		properties.push(`${finalFieldName}: ${zodProperty}`);
	});

	return `z.object({\n  ${properties.join(",\n  ")}\n})`;
}

function convertTypeToZod(
	typeNode: ts.TypeNode,
	sourceFile: ts.SourceFile,
	parentInterface?: string,
	availableNestedTypes?: string[],
): string {
	const typeText = typeNode.getText(sourceFile).trim();

	// Handle nested interface references (e.g., AttachParams.Option)
	if (parentInterface && typeText.includes(`${parentInterface}.`)) {
		const nestedTypeName = typeText.replace(
			`${parentInterface}.`,
			`${parentInterface}`,
		);
		if (availableNestedTypes?.includes(nestedTypeName)) {
			// Convert "CheckoutParamsOption" to "CheckoutParamsOptionSchema" (PascalCase)
			const schemaName = `${nestedTypeName}Schema`;
			return schemaName;
		}
	}

	// Handle external type references (CustomerData, EntityData, etc.)
	if (typeText === "CustomerData" || typeText === "Shared.CustomerData") {
		return "CustomerDataSchema";
	}
	if (typeText === "EntityData" || typeText === "Shared.EntityData") {
		return "EntityDataSchema";
	}

	// Handle basic types
	if (typeText === "string") return "z.string()";
	if (typeText === "number") return "z.number()";
	if (typeText === "boolean") return "z.boolean()";
	if (typeText === "unknown") return "z.unknown()";
	if (typeText === "any") return "z.any()";

	// Handle nullable types
	if (typeText.includes(" | null")) {
		const baseType = typeText.replace(" | null", "").trim();
		const baseZodType = convertTypeToZod(
			{ getText: () => baseType } as ts.TypeNode,
			sourceFile,
			parentInterface,
			availableNestedTypes,
		);
		return `${baseZodType}.nullable()`;
	}

	// Handle union types
	if (typeText.includes(" | ") && !typeText.includes("null")) {
		const types = typeText.split(" | ").map((t) => t.trim());
		const zodTypes = types.map((type) => {
			if (type === "string") return "z.string()";
			if (type === "number") return "z.number()";
			if (type === "boolean") return "z.boolean()";
			if (type.startsWith("'") && type.endsWith("'")) {
				return `z.literal(${type})`;
			}
			if (type.startsWith('"') && type.endsWith('"')) {
				return `z.literal(${type})`;
			}
			// Handle Array<Type> in unions
			if (type.startsWith("Array<") && type.endsWith(">")) {
				const innerType = type.slice(6, -1);
				const innerZodType = convertTypeToZod(
					{ getText: () => innerType } as ts.TypeNode,
					sourceFile,
					parentInterface,
					availableNestedTypes,
				);
				return `z.array(${innerZodType})`;
			}
			return "z.unknown()";
		});
		return `z.union([${zodTypes.join(", ")}])`;
	}

	// Handle arrays
	if (typeText.startsWith("Array<") && typeText.endsWith(">")) {
		const innerType = typeText.slice(6, -1);
		const innerZodType = convertTypeToZod(
			{ getText: () => innerType } as ts.TypeNode,
			sourceFile,
			parentInterface,
			availableNestedTypes,
		);
		return `z.array(${innerZodType})`;
	}

	if (typeText.endsWith("[]")) {
		const innerType = typeText.slice(0, -2);
		const innerZodType = convertTypeToZod(
			{ getText: () => innerType } as unknown as ts.TypeNode,
			sourceFile,
			parentInterface,
			availableNestedTypes,
		);
		return `z.array(${innerZodType})`;
	}

	// Handle Record types
	if (typeText.startsWith("Record<")) {
		// Extract key and value types from Record<K, V>
		const match = typeText.match(/Record<([^,]+),\s*([^>]+)>/);
		if (match) {
			const keyType = match[1]?.trim() ?? "";
			const valueType = match[2]?.trim() ?? "";

			const keyZodType = keyType === "string" ? "z.string()" : "z.string()"; // Default to string keys
			const valueZodType = convertTypeToZod(
				{ getText: () => valueType } as ts.TypeNode,
				sourceFile,
				parentInterface,
				availableNestedTypes,
			);
			return `z.record(${keyZodType}, ${valueZodType})`;
		}
		return "z.record(z.string(), z.unknown())";
	}

	// Handle index signature types like { [key: string]: unknown }
	if (typeText.match(/\{\s*\[\s*\w+\s*:\s*string\s*\]\s*:\s*\w+\s*\}/)) {
		const match = typeText.match(
			/\{\s*\[\s*\w+\s*:\s*string\s*\]\s*:\s*(\w+)\s*\}/,
		);
		if (match) {
			const valueType = match[1]?.trim() ?? "";
			const valueZodType =
				valueType === "unknown"
					? "z.unknown()"
					: valueType === "string"
						? "z.string()"
						: valueType === "number"
							? "z.number()"
							: valueType === "boolean"
								? "z.boolean()"
								: "z.unknown()";
			return `z.record(z.string(), ${valueZodType})`;
		}
	}

	// Handle object types with properties
	if (typeText.includes("{") && typeText.includes("}")) {
		return "z.object({})"; // Simplified for complex objects
	}

	// Default to unknown for complex types
	return "z.unknown()";
}

function toCamelCase(str: string): string {
	return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

/**
 * Extract JSDoc comment text from a TypeScript node
 */
function extractJSDocComment(
	node: ts.Node,
	sourceFile: ts.SourceFile,
): string | null {
	// For interface declarations, only use JSDoc that's directly attached to the interface
	// Don't fall back to parsing text, as this can pick up JSDoc from properties
	if (ts.isInterfaceDeclaration(node)) {
		const jsDocNodes = (node as unknown as { jsDoc: ts.JSDoc[] }).jsDoc;
		if (jsDocNodes && jsDocNodes.length > 0) {
			const jsDoc = jsDocNodes[0];
			if (jsDoc?.comment) {
				if (typeof jsDoc.comment === "string") {
					return jsDoc.comment.trim();
				} else if (Array.isArray(jsDoc.comment)) {
					return jsDoc.comment
						.map((part: { text: string }) =>
							typeof part === "string" ? part : part.text,
						)
						.join("")
						.trim();
				}
			}
		}
		// For interfaces without direct JSDoc, return null
		return null;
	}

	// For other nodes (properties, etc.), use the existing logic
	const jsDocNodes = (node as unknown as { jsDoc: ts.JSDoc[] }).jsDoc;
	if (jsDocNodes && jsDocNodes.length > 0) {
		const jsDoc = jsDocNodes[0];
		if (jsDoc?.comment) {
			if (typeof jsDoc.comment === "string") {
				return jsDoc.comment.trim();
			} else if (Array.isArray(jsDoc.comment)) {
				return jsDoc.comment
					.map((part: { text: string }) =>
						typeof part === "string" ? part : part.text,
					)
					.join("")
					.trim();
			}
		}
	}

	// Fallback: try the full text and parse manually (for property nodes)
	const fullText = node.getFullText(sourceFile);
	const jsDocMatch = fullText.match(/\/\*\*\s*([\s\S]*?)\s*\*\//);
	if (jsDocMatch) {
		// Clean up the JSDoc comment
		return (
			jsDocMatch[1] ??
			""
				.split("\n")
				.map((line) => line.replace(/^\s*\*\s?/, "").trim()) // Remove leading * and whitespace
				.filter((line) => line.length > 0) // Remove empty lines
				.join(" ")
				.trim()
		);
	}

	return null;
}

/**
 * Extract method signature and full JSDoc from a class method
 */
export function extractMethodInfo(
	sourceFile: ts.SourceFile,
	methodName: string,
): {
	jsdoc: string | null;
	paramType: string | null;
	returnType: string | null;
} | null {
	let result: {
		jsdoc: string | null;
		paramType: string | null;
		returnType: string | null;
	} | null = null;

	// Find the class and the method
	ts.forEachChild(sourceFile, (node) => {
		if (ts.isClassDeclaration(node)) {
			node.members.forEach((member) => {
				if (
					ts.isMethodDeclaration(member) &&
					member.name &&
					ts.isIdentifier(member.name) &&
					member.name.text === methodName
				) {
					// Extract full JSDoc including @param tags
					let jsdoc: string | null = null;
					const jsDocNodes = (member as unknown as { jsDoc: ts.JSDoc[] }).jsDoc;
					if (jsDocNodes && jsDocNodes.length > 0) {
						const jsDoc = jsDocNodes[0];
						// Get the full JSDoc text from the source file
						const fullText = jsDoc?.getFullText(sourceFile) ?? "";
						// Remove leading /** and trailing */ and clean up
						jsdoc = fullText
							.replace(/^\/\*\*/, "")
							.replace(/\*\/$/, "")
							.trim();
					}

					// Extract parameter type (first parameter's type)
					let paramType: string | null = null;
					if (member.parameters.length > 0) {
						const firstParam = member.parameters[0];
						if (firstParam?.type) {
							// Get the type text and clean it up
							const typeText = firstParam.type?.getText(sourceFile) ?? "";
							// Extract just the type name (e.g., "TopLevelAPI.AttachParams")
							paramType = typeText.replace(/^.*\./, ""); // Remove namespace prefix
						}
					}

					// Extract return type
					let returnType: string | null = null;
					if (member.type) {
						const typeText = member.type.getText(sourceFile);
						// Extract response type from APIPromise<TopLevelAPI.AttachResponse>
						const match = typeText.match(/APIPromise<.*\.(\w+Response)>/);
						if (match) {
							returnType = match[1] ?? "";
						}
					}

					result = { jsdoc, paramType, returnType };
				}
			});
		}
	});

	return result;
}

/**
 * Escape description text for use in Zod .describe() calls
 */
function escapeDescription(description: string): string {
	return description
		.replace(/\\/g, "\\\\") // Escape backslashes
		.replace(/"/g, '\\"') // Escape quotes
		.replace(/\n/g, "\\n") // Escape newlines
		.replace(/\r/g, "\\r") // Escape carriage returns
		.replace(/\t/g, "\\t"); // Escape tabs
}

/**
 * Generate an explicit TypeScript interface with JSDoc comments
 */
function generateExplicitInterface(
	interfaceDecl: ts.InterfaceDeclaration,
	sourceFile: ts.SourceFile,
	camelCase: boolean,
	interfaceName: string,
	availableNestedTypes: string[] = [],
	omitFields: string[] = [],
	extendFields: Record<string, { zodType: string; description?: string }> = {},
	interfaceDescription: string | null = null,
): string {
	const properties: string[] = [];
	const finalInterfaceName = camelCase
		? toCamelCase(interfaceName)
		: interfaceName;

	// Process existing interface members
	interfaceDecl.members.forEach((member) => {
		if (ts.isPropertySignature(member)) {
			const propertyName = member.name?.getText(sourceFile);
			const isOptional = member.questionToken !== undefined;
			const typeNode = member.type;

			if (propertyName && typeNode) {
				// Check if this field should be omitted
				if (omitFields.includes(propertyName)) {
					return; // Skip this property
				}

				const finalPropertyName = camelCase
					? toCamelCase(propertyName)
					: propertyName;

				const tsType = convertZodToTypeScript(
					typeNode,
					sourceFile,
					interfaceName,
					availableNestedTypes,
				);

				// Extract JSDoc comment for this property
				const description = extractJSDocComment(member, sourceFile);

				// Build the TypeScript property with JSDoc
				let propertyString = "";
				if (description) {
					propertyString += `  /**\n   * ${description.replace(/\*\//g, "* /")}\n   */\n`;
				}

				propertyString += `  ${finalPropertyName}${isOptional ? "?" : ""}: ${tsType};`;
				properties.push(propertyString);
			}
		}
	});

	// Add extended fields
	Object.entries(extendFields).forEach(([fieldName, config]) => {
		const finalFieldName = camelCase ? toCamelCase(fieldName) : fieldName;

		let propertyString = "";
		if (config.description) {
			propertyString += `  /**\n   * ${config.description.replace(/\*\//g, "* /")}\n   */\n`;
		}

		const tsType = convertZodTypeToTypeScript(config.zodType);
		// Extended fields from config are typically optional
		propertyString += `  ${finalFieldName}?: ${tsType};`;
		properties.push(propertyString);
	});

	// Generate the interface with JSDoc
	let interfaceString = "";
	if (interfaceDescription) {
		interfaceString += `/**\n * ${interfaceDescription.replace(/\*\//g, "* /")}\n */\n`;
	}

	interfaceString += `export interface ${finalInterfaceName} {\n${properties.join("\n\n")}\n}`;

	return interfaceString;
}

/**
 * Convert a TypeScript type node to TypeScript type string for interface generation
 */
function convertZodToTypeScript(
	typeNode: ts.TypeNode,
	sourceFile: ts.SourceFile,
	parentInterface?: string,
	availableNestedTypes?: string[],
): string {
	const typeText = typeNode.getText(sourceFile).trim();

	// Handle nested interface references (e.g., AttachParams.Option)
	if (parentInterface && typeText.includes(`${parentInterface}.`)) {
		const nestedTypeName = typeText.replace(
			`${parentInterface}.`,
			`${parentInterface}`,
		);
		if (availableNestedTypes?.includes(nestedTypeName)) {
			return nestedTypeName;
		}
	}

	// Handle external type references (CustomerData, EntityData, etc.)
	if (typeText === "CustomerData" || typeText === "Shared.CustomerData") {
		return "CustomerData";
	}
	if (typeText === "EntityData" || typeText === "Shared.EntityData") {
		return "EntityData";
	}

	// Handle arrays
	if (typeText.startsWith("Array<") && typeText.endsWith(">")) {
		const innerType = typeText.slice(6, -1);
		const innerTsType = convertZodToTypeScript(
			{ getText: () => innerType } as ts.TypeNode,
			sourceFile,
			parentInterface,
			availableNestedTypes,
		);
		// Wrap union types in parentheses before appending []
		if (innerTsType.includes(" | ")) {
			return `(${innerTsType})[]`;
		}
		return `${innerTsType}[]`;
	}

	if (typeText.endsWith("[]")) {
		const innerType = typeText.slice(0, -2);
		const innerTsType = convertZodToTypeScript(
			{ getText: () => innerType } as unknown as ts.TypeNode,
			sourceFile,
			parentInterface,
			availableNestedTypes,
		);
		// Wrap union types in parentheses before appending []
		if (innerTsType.includes(" | ")) {
			return `(${innerTsType})[]`;
		}
		return `${innerTsType}[]`;
	}

	// Handle Record types
	if (typeText.startsWith("Record<")) {
		return typeText; // Keep Record<K, V> as is
	}

	// Handle nullable types
	if (typeText.includes(" | null")) {
		const baseType = typeText.replace(" | null", "").trim();
		const baseTsType = convertZodToTypeScript(
			{ getText: () => baseType } as ts.TypeNode,
			sourceFile,
			parentInterface,
			availableNestedTypes,
		);
		return `${baseTsType} | null`;
	}

	// Return the type as is for basic types and others
	return typeText;
}

/**
 * Convert a Zod type string to TypeScript type string
 */
function convertZodTypeToTypeScript(zodType: string): string {
	// Handle common Zod types
	if (zodType.includes("z.string()") && !zodType.includes("z.record("))
		return "string";
	if (zodType.includes("z.number()")) return "number";
	if (zodType.includes("z.boolean()")) return "boolean";
	if (zodType.includes("z.any()") && !zodType.includes("z.record("))
		return "any";
	if (zodType.includes("z.unknown()")) return "unknown";

	// Handle arrays
	if (zodType.includes("z.array(")) {
		if (zodType.includes("z.array(z.string())")) return "string[]";
		if (zodType.includes("z.array(z.number())")) return "number[]";
		if (zodType.includes("z.array(z.boolean())")) return "boolean[]";
		// Handle nested schema arrays (e.g., z.array(AttachParamsOptionSchema))
		const arraySchemaMatch = zodType.match(/z\.array\((\w+Schema)\)/);
		if (arraySchemaMatch) {
			const schemaName = arraySchemaMatch[1];
			const interfaceName = schemaName?.replace("Schema", "") ?? "";
			return `${interfaceName}[]`;
		}
		return "any[]"; // Fallback for complex arrays
	}

	// Handle records - need to parse more carefully to handle nested parentheses
	if (zodType.includes("z.record(")) {
		// Handle the simple case: z.record(z.string(), z.any())
		const simpleRecordMatch = zodType.match(
			/z\.record\(z\.string\(\),\s*z\.any\(\)\)/,
		);
		if (simpleRecordMatch) {
			return "Record<string, any>";
		}

		// Handle other z.record patterns
		const recordMatch = zodType.match(/z\.record\(([^,]+),\s*([^)]+)\)/);
		if (recordMatch) {
			const keyType = convertZodTypeToTypeScript(recordMatch[1]?.trim() ?? "");
			const valueType = convertZodTypeToTypeScript(
				recordMatch[2]?.trim() ?? "",
			);
			return `Record<${keyType}, ${valueType}>`;
		}
		return "Record<string, any>";
	}

	// Handle unions
	if (zodType.includes("z.union(")) {
		// Try to parse union types more intelligently
		const unionMatch = zodType.match(/z\.union\(\[(.*)\]\)/);
		if (unionMatch) {
			const unionTypes = unionMatch[1]?.split(", ").map((type) => {
				return convertZodTypeToTypeScript(type.trim());
			});
			return unionTypes?.join(" | ") ?? "";
		}
		return "string | number"; // Simplified fallback
	}

	// Handle literals
	if (zodType.includes("z.literal(")) {
		const literalMatch = zodType.match(/z\.literal\(([^)]+)\)/);
		if (literalMatch) {
			return literalMatch[1] ?? "";
		}
	}

	// Handle nullable types with .nullable()
	if (zodType.includes(".nullable()")) {
		const baseType = zodType.replace(".nullable()", "").trim();
		const baseTs = convertZodTypeToTypeScript(baseType);
		return `${baseTs} | null`;
	}

	// Handle optional types (shouldn't affect the type itself)
	if (zodType.includes(".optional()")) {
		const baseType = zodType.replace(".optional()", "").trim();
		return convertZodTypeToTypeScript(baseType);
	}

	// Handle describe calls
	if (zodType.includes(".describe(")) {
		const baseType = zodType.replace(/\.describe\([^)]+\)/, "").trim();
		return convertZodTypeToTypeScript(baseType);
	}

	// Fallback
	return "any";
}

// Example usage
export function generateCoreAttachParamsSchema() {
	return generateCamelZod({
		inputFile:
			"/Users/johnyeocx/Autumn/autumn-js/stainless/autumn-typescript/src/resources/core.ts",
		typeName: "CoreAttachParams",
		outputFile:
			"/Users/johnyeocx/Autumn/autumn-js/nextjs/utils/core-attach-schema.ts",
		camelCase: true,
	});
}
