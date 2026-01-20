import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import * as ts from "typescript";
import type { MethodConfig, MethodGenerationConfig } from "../typeConfigs.js";
import { extractMethodInfo } from "./auto-schema-generator.js";

/**
 * Generates TypeScript method signatures with JSDoc from SDK client methods
 */
export class MethodGenerator {
	private readonly tsSDKPath: string;
	private readonly targetPath: string;

	constructor(tsSDKPath: string, targetPath: string) {
		this.tsSDKPath = tsSDKPath;
		this.targetPath = targetPath;
	}

	/**
	 * Generate method signatures based on configuration(s)
	 */
	async generateMethods(
		configs: MethodGenerationConfig | MethodGenerationConfig[],
	): Promise<void> {
		const configArray = Array.isArray(configs) ? configs : [configs];
		const totalMethods = configArray.reduce(
			(sum, config) => sum + config.methods.length,
			0,
		);

		console.log(`⚡ Generating ${totalMethods} method signatures...`);

		// Group configs by target file to merge multiple sources into one interface
		const configsByTargetFile = new Map<string, MethodGenerationConfig[]>();
		for (const config of configArray) {
			const existing = configsByTargetFile.get(config.targetFile) || [];
			existing.push(config);
			configsByTargetFile.set(config.targetFile, existing);
		}

		// Process each target file
		for (const [targetFile, targetConfigs] of configsByTargetFile.entries()) {
			// Ensure output directory exists
			const outputDir = path.dirname(targetFile);
			if (!existsSync(outputDir)) {
				mkdirSync(outputDir, { recursive: true });
			}

			const allMethodSignatures: string[] = [];
			const interfaceName = targetConfigs[0]?.interfaceName;
			const interfaceDescription = targetConfigs[0]?.interfaceDescription;

			// Process each config for this target file
			for (const config of targetConfigs) {
				// Parse the SDK source file
				const program = ts.createProgram([config.sourceFile], {
					target: ts.ScriptTarget.ES2020,
					module: ts.ModuleKind.CommonJS,
					skipLibCheck: true,
					noResolve: true,
				});

				const sourceFile = program.getSourceFile(config.sourceFile);
				if (!sourceFile) {
					throw new Error(`Could not find source file: ${config.sourceFile}`);
				}

				// Extract and generate each method from this config
				for (const methodConfig of config.methods) {
					const extracted = extractMethodInfo(
						sourceFile,
						methodConfig.sourceName,
					);

					if (!extracted) {
						console.warn(
							`⚠️  Method ${methodConfig.sourceName} not found in ${config.sourceFile}`,
						);
						continue;
					}

					const signature = this.buildMethodSignature(methodConfig, extracted);
					allMethodSignatures.push(signature);
				}
			}

			// Generate the complete output file with all methods
			const outputContent = this.generateOutputFile(
				allMethodSignatures,
				interfaceName,
				interfaceDescription,
			);
			writeFileSync(targetFile, outputContent);
		}

		console.log(`✅ Generated ${totalMethods} method signatures`);
	}

	/**
	 * Build a single method signature with JSDoc
	 */
	private buildMethodSignature(
		config: MethodConfig,
		extracted: {
			jsdoc: string | null;
			paramType: string | null;
			returnType: string | null;
		},
	): string {
		// Get the param type name (camelCase version from our typegen)
		const paramType = this.getClientParamType(config);

		// Get the return type
		const returnType = this.getReturnType(config, extracted.returnType);

		// Build the JSDoc - use extracted JSDoc directly
		let jsdoc = "";
		if (extracted.jsdoc) {
			// Clean up the JSDoc with configured exclusions
			const cleanedJsdoc = this.cleanJsDoc(
				extracted.jsdoc,
				config.exclusions || [],
			);
			jsdoc = `  /**\n${cleanedJsdoc}\n   */`;
		} else {
			jsdoc = `  /**\n   * ${config.targetName} method\n   */`;
		}

		// Build the method signature
		const signature = `  ${config.targetName}: (params: ${paramType}) => ${returnType};`;

		return `${jsdoc}\n${signature}`;
	}

	/**
	 * Clean JSDoc by removing excluded params and formatting
	 */
	private cleanJsDoc(jsdoc: string, exclusions: string[]): string {
		// First, join all lines and clean up, replacing line breaks within JSDoc
		const cleanedText = jsdoc
			.split("\n")
			.map((line) => line.replace(/^\s*\*\s?/, "")) // Remove leading * and whitespace
			.join(" ")
			.replace(/\s+/g, " "); // Normalize whitespace

		// Split by @param, @example, @see, @returns to get sections
		const sections: string[] = [];
		const currentText = cleanedText;

		// Extract and process @param tags
		const paramMatches = currentText.matchAll(
			/@param\s+([^\s]+)\s+-\s+([^@]+)/g,
		);
		const params: Array<{ name: string; description: string }> = [];

		for (const match of paramMatches) {
			const paramName = match[1] ?? "";
			const description = (match[2] ?? "").trim();
			params.push({ name: paramName, description });
		}

		// Remove all @param tags from the text to get the description and other tags
		const textWithoutParams = currentText.replace(
			/@param\s+[^\s]+\s+-\s+[^@]+/g,
			"",
		);

		// Split into sections by tags
		const parts = textWithoutParams.split(/(@example|@see|@returns)/);
		const processedLines: string[] = [];

		// Add description (before any tags)
		const description = parts[0]?.trim() ?? "";
		if (description) {
			// Split description into multiple lines if needed (wrap at reasonable length)
			const descLines = description.split(/\.\s+/).filter((l) => l.trim());
			for (const line of descLines) {
				if (line.trim()) {
					processedLines.push(
						`   * ${line.trim()}${line.endsWith(".") ? "" : "."}`,
					);
				}
			}
			processedLines.push("   *");
		}

		// Add filtered @param tags
		for (const param of params) {
			const shouldExclude = exclusions.some((exclusion) =>
				`@param ${param.name}`.includes(`@param ${exclusion}`),
			);

			if (!shouldExclude) {
				// Transform body.field → params.field
				const transformedName = param.name.replace(/^body\./, "params.");
				processedLines.push(
					`   * @param ${transformedName} - ${param.description}`,
				);
			}
		}

		// Add other tags (@example, @see, etc.)
		for (let i = 1; i < parts.length; i += 2) {
			const tag = parts[i];
			const content = parts[i + 1];
			if (tag && content) {
				processedLines.push("   *");
				processedLines.push(`   * ${tag}`);
				// Keep content as-is for @example and @see
				const contentLines = content.trim().split("\n");
				for (const line of contentLines) {
					if (line.trim()) {
						processedLines.push(`   * ${line.trim()}`);
					}
				}
			}
		}

		return processedLines.join("\n");
	}

	/**
	 * Get client-side parameter type name (generated by typegen)
	 */
	private getClientParamType(config: MethodConfig): string {
		// Use custom paramType if provided
		if (config.paramType) {
			return config.paramType;
		}
		// Otherwise, convert method name to PascalCase + Params
		const pascal =
			config.sourceName.charAt(0).toUpperCase() + config.sourceName.slice(1);
		return `${pascal}Params`;
	}

	/**
	 * Get return type for the method
	 */
	private getReturnType(
		config: MethodConfig,
		sdkReturnType: string | null,
	): string {
		// Use custom returnType if provided in config
		const finalReturnType = config.returnType || sdkReturnType || "unknown";

		if (config.isSync) {
			// Synchronous methods return the response directly
			return `Autumn.${finalReturnType}`;
		}

		// Async methods return Promise
		return `Promise<Autumn.${finalReturnType}>`;
	}

	/**
	 * Generate the complete output file with all methods
	 */
	private generateOutputFile(
		methodSignatures: string[],
		interfaceName?: string,
		interfaceDescription?: string,
	): string {
		const finalInterfaceName = interfaceName || "UseCustomerMethods";
		const finalDescription =
			interfaceDescription ||
			"Methods available in useCustomer and useEntity hooks\n *\n * All method documentation is extracted from the SDK, which is generated\n * from the OpenAPI spec in the backend repository.";

		// Extract param types from method signatures
		const paramTypes = new Set<string>();
		for (const signature of methodSignatures) {
			// Match pattern like "params: XxxParams)"
			const match = signature.match(/params:\s*(\w+Params)\)/);
			if (match?.[1]) {
				paramTypes.add(match[1]);
			}
		}

		// Generate import statement
		const sortedParamTypes = Array.from(paramTypes).sort();
		const importList = sortedParamTypes.map((type) => `  ${type},`).join("\n");

		return `// Auto-generated method signatures with JSDoc
// This file is generated by typegen pipeline from @useautumn/sdk
// DO NOT EDIT MANUALLY - changes will be overwritten
//
// To update documentation:
// 1. Edit JSDoc in backend server's shared/api directory
// 2. Regenerate OpenAPI spec and SDK
// 3. Run: pnpm run gen:autumn-js

import type { Autumn } from "@useautumn/sdk";
import type {
${importList}
} from "@/clientTypes";

/**
 * ${finalDescription}
 */
export interface ${finalInterfaceName} {
${methodSignatures.join("\n\n")}
}
`;
	}
}
