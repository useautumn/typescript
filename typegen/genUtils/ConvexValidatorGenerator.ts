import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import * as ts from "typescript";
import type { ConvexValidatorConfig } from "../convexTypeConfigs.js";

/**
 * Generates Convex v.object() validators from TypeScript interfaces
 *
 * Similar to TypeGenerator but outputs Convex validators instead of Zod schemas.
 * Converts TypeScript SDK types to Convex validation schemas with camelCase field names.
 */
export class ConvexValidatorGenerator {
	private programCache = new Map<
		string,
		{ program: ts.Program; sourceFile: ts.SourceFile }
	>();

	/**
	 * Generate all validators based on provided configurations
	 */
	async generateValidators(
		configs: ConvexValidatorConfig[],
		outputPath: string,
	): Promise<void> {
		const startTime = Date.now();
		console.log(`⚡ Processing ${configs.length} validators...`);

		const validatorCodes: string[] = [];
		const results = await Promise.allSettled(
			configs.map(async (config) => {
				try {
					const code = this.generateSingleValidator(config);
					validatorCodes.push(code);
					return { config, success: true as const };
				} catch (error) {
					const errorMessage =
						error instanceof Error ? error.message : String(error);
					console.error(`❌ Failed ${config.targetName}: ${errorMessage}`);
					return { config, success: false as const, error: errorMessage };
				}
			}),
		);

		const processedResults = results.map((result, index) => {
			if (result.status === "fulfilled") {
				return result.value;
			}
			const config = configs[index];
			if (!config) {
				throw new Error(`Config not found at index ${index}`);
			}
			return {
				config,
				success: false as const,
				error: result.reason?.message || "Unknown error",
			};
		});

		// Write all validators to output file
		this.writeOutputFile(outputPath, validatorCodes);

		const duration = Date.now() - startTime;
		this.printSummary(processedResults, duration);
	}

	/**
	 * Generate a single validator from TypeScript interface
	 */
	private generateSingleValidator(config: ConvexValidatorConfig): string {
		const { sourceFile } = this.getOrCreateProgram(config.sourceFile);
		const interfaceDecl = this.findInterface(sourceFile, config.sourceName);

		if (!interfaceDecl) {
			throw new Error(
				`Interface ${config.sourceName} not found in ${config.sourceFile}`,
			);
		}

		const validatorCode = this.generateValidatorCode(
			interfaceDecl,
			sourceFile,
			config.targetName,
			config.excludeFields,
			config.camelCase,
		);

		console.log(`✓ Generated ${config.targetName}`);
		return validatorCode;
	}

	/**
	 * Generate Convex validator code from interface
	 */
	private generateValidatorCode(
		interfaceDecl: ts.InterfaceDeclaration,
		sourceFile: ts.SourceFile,
		targetName: string,
		excludeFields: string[],
		camelCase: boolean,
	): string {
		const properties: string[] = [];

		interfaceDecl.members.forEach((member) => {
			if (ts.isPropertySignature(member)) {
				const propertyName = member.name?.getText(sourceFile);
				const isOptional = member.questionToken !== undefined;
				const typeNode = member.type;

				if (propertyName && typeNode && !excludeFields.includes(propertyName)) {
					const finalPropertyName = camelCase
						? this.toCamelCase(propertyName)
						: propertyName;
					const convexType = this.convertTypeToConvex(
						typeNode,
						sourceFile,
						isOptional,
					);

					properties.push(`  ${finalPropertyName}: ${convexType}`);
				}
			}
		});

		return `export const ${targetName} = v.object({\n${properties.join(",\n")}\n});\n\nexport type ${targetName}Type = Infer<typeof ${targetName}>;`;
	}

	/**
	 * Convert TypeScript type to Convex validator
	 */
	private convertTypeToConvex(
		typeNode: ts.TypeNode,
		sourceFile: ts.SourceFile,
		isOptional: boolean,
	): string {
		const typeText = typeNode.getText(sourceFile).trim();

		// Build base type
		const baseType = this.getBaseConvexType(typeText, sourceFile);

		// Wrap in optional if needed
		return isOptional ? `v.optional(${baseType})` : baseType;
	}

	/**
	 * Get base Convex type (without optional wrapper)
	 */
	private getBaseConvexType(
		typeText: string,
		sourceFile: ts.SourceFile,
	): string {
		// Handle basic types
		if (typeText === "string") return "v.string()";
		if (typeText === "number") return "v.number()";
		if (typeText === "boolean") return "v.boolean()";
		if (typeText === "unknown" || typeText === "any") return "v.any()";

		// Handle nullable types (string | null)
		if (typeText.includes(" | null")) {
			const baseType = typeText.replace(" | null", "").trim();
			const baseConvex = this.getBaseConvexType(baseType, sourceFile);
			return `v.union(${baseConvex}, v.null())`;
		}

		// Handle arrays (must be before union types to catch Array<'a' | 'b'>)
		if (typeText.startsWith("Array<") && typeText.endsWith(">")) {
			const innerType = typeText.slice(6, -1).trim();

			// Normalize whitespace - replace all newlines and multiple spaces with single space
			const normalizedInner = innerType.replace(/\s+/g, " ").trim();

			// Check if this is a union of literals
			if (normalizedInner.includes(" | ")) {
				const parts = normalizedInner.split(" | ").map((t) => t.trim());
				const allLiterals = parts.every(
					(p) => p.startsWith("'") || p.startsWith('"'),
				);

				if (allLiterals) {
					const convexLiterals = parts
						.map((lit) => `v.literal(${lit})`)
						.join(", ");
					return `v.array(v.union(${convexLiterals}))`;
				}
			}

			const innerConvex = this.getBaseConvexType(normalizedInner, sourceFile);
			return `v.array(${innerConvex})`;
		}

		// Handle union types
		if (typeText.includes(" | ") && !typeText.includes("null")) {
			const types = typeText.split(" | ").map((t) => t.trim());
			const convexTypes = types.map((type) => {
				if (type === "string") return "v.string()";
				if (type === "number") return "v.number()";
				if (type === "boolean") return "v.boolean()";
				if (type.startsWith("'") || type.startsWith('"')) {
					return `v.literal(${type})`;
				}
				return "v.any()";
			});
			return `v.union(${convexTypes.join(", ")})`;
		}

		if (typeText.endsWith("[]")) {
			const innerType = typeText.slice(0, -2);
			const innerConvex = this.getBaseConvexType(innerType, sourceFile);
			return `v.array(${innerConvex})`;
		}

		// Handle Record types
		if (typeText.startsWith("Record<")) {
			const match = typeText.match(/Record<([^,]+),\s*([^>]+)>/);
			if (match) {
				const valueType = match[2]?.trim() ?? "";
				const valueConvex = this.getBaseConvexType(valueType, sourceFile);
				return `v.record(v.string(), ${valueConvex})`;
			}
		}

		// Handle index signature types like { [key: string]: unknown }
		if (typeText.match(/\{\s*\[\s*\w+\s*:\s*string\s*\]\s*:\s*\w+\s*\}/)) {
			const match = typeText.match(
				/\{\s*\[\s*\w+\s*:\s*string\s*\]\s*:\s*(\w+)\s*\}/,
			);
			if (match) {
				const valueType = match[1]?.trim() ?? "";
				const valueConvex = this.getBaseConvexType(valueType, sourceFile);
				return `v.record(v.string(), ${valueConvex})`;
			}
		}

		// Handle external type references (CustomerData, EntityData)
		if (
			typeText === "TrackParams.CustomerData" ||
			typeText === "Shared.CustomerData" ||
			typeText === "CustomerData"
		) {
			return "CustomerDataConvex";
		}
		if (
			typeText === "TrackParams.EntityData" ||
			typeText === "Shared.EntityData" ||
			typeText === "EntityData"
		) {
			return "EntityDataConvex";
		}

		// Handle object types
		if (typeText.includes("{") && typeText.includes("}")) {
			return "v.object({})";
		}

		// Default to any for complex types
		return "v.any()";
	}

	/**
	 * Convert snake_case to camelCase
	 */
	private toCamelCase(str: string): string {
		return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
	}

	/**
	 * Find interface in source file
	 */
	private findInterface(
		sourceFile: ts.SourceFile,
		interfaceName: string,
	): ts.InterfaceDeclaration | null {
		let result: ts.InterfaceDeclaration | null = null;

		function visit(node: ts.Node) {
			if (ts.isInterfaceDeclaration(node) && node.name.text === interfaceName) {
				result = node;
			}
			ts.forEachChild(node, visit);
		}

		visit(sourceFile);
		return result;
	}

	/**
	 * Get or create TypeScript program for a file
	 */
	private getOrCreateProgram(sourceFilePath: string): { program: ts.Program; sourceFile: ts.SourceFile } {
		const cached = this.programCache.get(sourceFilePath);
		if (cached) {
			return cached;
		}

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

		const result = { program, sourceFile };
		this.programCache.set(sourceFilePath, result);
		return result;
	}

	/**
	 * Write all validators to output file
	 */
	private writeOutputFile(outputPath: string, validatorCodes: string[]): void {
		const header = `/**
 * 🤖 AUTO-GENERATED - DO NOT EDIT
 *
 * Generated by: typegen/generate-convex-types.ts
 * Source: @ts-sdk OpenAPI-generated interfaces
 *
 * To regenerate: pnpm gen:convex-types
 */

import { v, type Infer } from "convex/values";

`;

		// Note: CustomerDataConvex and EntityDataConvex are generated from SDK,
		// so they'll appear in validatorCodes. Manual types that depend on them
		// must come AFTER the generated types.
		const manualTypesPrefix = `// Manual type definitions (not in SDK)

export const IdentifierOpts = v.object({
  customerId: v.string(),
  customerData: v.optional(
    v.object({
      name: v.optional(v.string()),
      email: v.optional(v.string()),
    })
  ),
});

export type IdentifierOptsType = Infer<typeof IdentifierOpts>;

export const AttachFeatureOptionsConvex = v.object({
  featureId: v.string(),
  quantity: v.number(),
});

export const EntityDataConvex = v.object({
  name: v.optional(v.string()),
  featureId: v.string(),
  id: v.optional(v.string()),
});

export const ExpandArgs = v.optional(
  v.array(
    v.union(
      v.literal("payment_method"),
      v.literal("invoices"),
      v.literal("rewards"),
      v.literal("trials_used"),
      v.literal("entities"),
      v.literal("referrals")
    )
  )
);

`;

		// Manual types that depend on generated types (must come after)
		// Currently empty - all types are now auto-generated
		const manualTypesSuffix = "";

		const content =
			header +
			manualTypesPrefix +
			"\n" +
			validatorCodes.join("\n\n") +
			(manualTypesSuffix ? "\n" + manualTypesSuffix : "");

		// Ensure output directory exists
		const outputDir = path.dirname(outputPath);
		if (!existsSync(outputDir)) {
			mkdirSync(outputDir, { recursive: true });
		}

		writeFileSync(outputPath, content);
		console.log(`\n📝 Wrote validators to ${outputPath}`);
	}

	/**
	 * Print summary of generation process
	 */
	private printSummary(
		results: {
			config: ConvexValidatorConfig;
			success: boolean;
			error?: string;
		}[],
		duration: number,
	): void {
		const successful = results.filter((r) => r.success).length;
		const failed = results.filter((r) => !r.success).length;

		console.log(
			`📊 ${successful} successful, ${failed} failed (${duration}ms)`,
		);

		if (failed > 0) {
			console.log(`\n❌ Failed generations:`);
			results
				.filter((r) => !r.success)
				.forEach((r) => {
					console.log(`   - ${r.config.sourceName}: ${r.error}`);
				});
		}
	}
}
