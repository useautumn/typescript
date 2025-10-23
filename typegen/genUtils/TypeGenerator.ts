import { writeFileSync, mkdirSync, existsSync } from "fs";
import path from "path";
import { generateCamelZod } from "./auto-schema-generator";
import {
	extractZodSchema,
	transformZodSchema,
	generateZodSchemaFile,
} from "./ZodSchemaGenerator";
import type { TypeConfig, TypeGenerationConfig } from "../typeConfigs";

/**
 * Main Type Generator class that orchestrates the conversion process
 * 
 * This class handles the generation of camelCase Zod schemas from snake_case SDK types.
 * It processes multiple type configurations and generates organized output files.
 */
export class TypeGenerator {
  private readonly tsSDKPath: string;
  private readonly targetPath: string;

  constructor(tsSDKPath: string, targetPath: string) {
    this.tsSDKPath = tsSDKPath;
    this.targetPath = targetPath;
  }

  /**
   * Generate all types based on provided configurations
   */
  async generateTypes(config: TypeGenerationConfig): Promise<void> {
    const { configs, outputDir } = config;
    const startTime = Date.now();

    console.log(`⚡ Processing ${configs.length} types...`);

    // Group configs by target file (for Zod sources that share a file)
    const zodConfigs = configs.filter(c => c.sourceType === "zod");
    const interfaceConfigs = configs.filter(c => c.sourceType !== "zod");

    // Group Zod configs by target file
    const zodConfigsByFile = new Map<string, TypeConfig[]>();
    for (const config of zodConfigs) {
      const existing = zodConfigsByFile.get(config.targetFile) || [];
      existing.push(config);
      zodConfigsByFile.set(config.targetFile, existing);
    }

    // Generate Zod schemas (grouped by file)
    const zodResults = await Promise.allSettled(
      Array.from(zodConfigsByFile.entries()).map(async ([targetFile, fileConfigs]) => {
        try {
          this.generateZodSchemas(fileConfigs);
          return fileConfigs.map(c => ({ config: c, success: true as const }));
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          console.error(`❌ Failed generating ${targetFile}: ${errorMessage}`);
          return fileConfigs.map(c => ({
            config: c,
            success: false as const,
            error: errorMessage
          }));
        }
      })
    );

    // Generate interface-based types
    const interfaceResults = await Promise.allSettled(
      interfaceConfigs.map(async (config) => {
        try {
          this.generateSingleType(config);
          return { config, success: true as const };
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          console.error(`❌ Failed ${config.targetName}: ${errorMessage}`);
          return { config, success: false as const, error: errorMessage };
        }
      })
    );

    // Flatten and combine results
    const flatZodResults = zodResults.flatMap(r =>
      r.status === 'fulfilled' ? r.value : []
    );
    const flatInterfaceResults = interfaceResults.map(r =>
      r.status === 'fulfilled' ? r.value : {
        config: interfaceConfigs[interfaceResults.indexOf(r)],
        success: false as const,
        error: 'Unknown error'
      }
    );

    const processedResults = [...flatZodResults, ...flatInterfaceResults];

    // Append manual type unions if configured
    if (config.manualTypeUnions) {
      this.appendManualTypeUnions(config.manualTypeUnions);
    }

    // Generate index file and print summary
    const duration = Date.now() - startTime;
    this.printSummary(processedResults, duration);
    await this.generateIndexFile(configs, outputDir);
  }

  /**
   * Append manual type unions to files
   */
  private appendManualTypeUnions(unions: Array<{ targetFile: string; typeCode: string }>): void {
    for (const union of unions) {
      const { targetFile, typeCode } = union;

      // Read existing file
      const existingContent = require('fs').readFileSync(targetFile, 'utf-8');

      // Append the manual type code
      const newContent = existingContent + '\n' + typeCode + '\n';

      writeFileSync(targetFile, newContent);
    }
  }

  /**
   * Generate multiple Zod schemas that write to the same file
   */
  private generateZodSchemas(configs: TypeConfig[]): void {
    if (configs.length === 0) return;

    // Ensure output directory exists
    const targetFile = configs[0]?.targetFile;
    if (!targetFile) return;

    const outputDir = path.dirname(targetFile);
    if (!existsSync(outputDir)) {
      mkdirSync(outputDir, { recursive: true });
    }

    // Create mapping of source schema names to target schema names
    const schemaNameMap = new Map<string, string>();
    configs.forEach(config => {
      schemaNameMap.set(config.sourceName, `${config.targetName}Schema`);
    });

    // Extract and transform all schemas
    const schemas = configs.map(config => {
      const { schemaCode, jsdoc } = extractZodSchema(
        config.sourceFile,
        config.sourceName
      );

      let transformed = transformZodSchema(schemaCode, {
        omitFields: config.omitFields || [],
        renameFields: config.renameFields || {},
        extendFields: config.extendFields || {},
        keepCase: config.keepCase !== false,
      });

      // Replace schema references (e.g., UpdatePlanFeatureSchema -> PlanFeatureSchema)
      for (const [sourceName, targetName] of schemaNameMap) {
        transformed = transformed.replace(new RegExp(sourceName, 'g'), targetName);
      }

      // Replace enums with literal unions if requested
      if (config.replaceEnumsWithStrings) {
        transformed = this.replaceEnumsWithLiterals(transformed);
      }

      return {
        schemaName: `${config.targetName}Schema`,
        typeName: config.targetName,
        schemaCode: transformed,
        jsdoc,
        originalCode: schemaCode,
        skipTypeExport: config.skipTypeExport || false,
      };
    });

    // Detect required imports by analyzing all schema code
    const allSchemaCode = schemas.map(s => s.originalCode).join('\n');
    const imports = this.detectRequiredImports(allSchemaCode);

    // Build the file content with all schemas
    let content = `// AUTO-GENERATED - DO NOT EDIT MANUALLY
// Generated from @autumn/shared schemas
// Run \`pnpm gen:atmn\` to regenerate

import { z } from "zod/v4";
${imports}

`;

    // Add schemas in dependency order (referenced schemas first)
    // Sort so that referenced schemas come before schemas that reference them
    const sortedSchemas = this.sortSchemasByDependencies(schemas);

    // Add each schema
    for (const schema of sortedSchemas) {
      if (schema.jsdoc) {
        content += `/**
 * ${schema.jsdoc.replace(/\*\//g, "* /")}
 */
`;
      }

      content += `export const ${schema.schemaName} = ${schema.schemaCode};

`;

      // Only export type if not skipped
      if (!schema.skipTypeExport) {
        content += `export type ${schema.typeName} = z.infer<typeof ${schema.schemaName}>;

`;
      }
    }

    writeFileSync(targetFile, content);
  }

  /**
   * Sort schemas by dependencies (referenced schemas first)
   */
  private sortSchemasByDependencies(
    schemas: Array<{ schemaName: string; schemaCode: string; jsdoc: string | null; typeName: string; originalCode: string }>
  ): Array<{ schemaName: string; schemaCode: string; jsdoc: string | null; typeName: string; originalCode: string }> {
    // Build dependency map
    const dependencies = new Map<string, Set<string>>();

    schemas.forEach(schema => {
      const deps = new Set<string>();
      schemas.forEach(other => {
        if (schema.schemaName !== other.schemaName &&
            schema.schemaCode.includes(other.schemaName)) {
          deps.add(other.schemaName);
        }
      });
      dependencies.set(schema.schemaName, deps);
    });

    // Topological sort
    const sorted: typeof schemas = [];
    const visited = new Set<string>();
    const visiting = new Set<string>();

    const visit = (schemaName: string) => {
      if (visited.has(schemaName)) return;
      if (visiting.has(schemaName)) {
        // Circular dependency - just add it anyway
        return;
      }

      visiting.add(schemaName);
      const deps = dependencies.get(schemaName) || new Set();

      for (const dep of deps) {
        visit(dep);
      }

      visiting.delete(schemaName);
      visited.add(schemaName);

      const schema = schemas.find(s => s.schemaName === schemaName);
      if (schema) {
        sorted.push(schema);
      }
    };

    schemas.forEach(schema => visit(schema.schemaName));

    return sorted;
  }

  /**
   * Get enum values map for replacing enums with literal unions
   */
  private getEnumValuesMap(): Record<string, string[]> {
    return {
      BillingInterval: ['month', 'quarter', 'semi_annual', 'year'],
      ResetInterval: ['one_off', 'minute', 'hour', 'day', 'week', 'month', 'quarter', 'year'],
      UsageModel: ['prepaid', 'pay_per_use'],
      OnIncrease: ['prorate', 'charge_immediately'],
      OnDecrease: ['prorate', 'refund_immediately', 'no_action'],
      FreeTrialDuration: ['day', 'month', 'year'],
      ApiFeatureType: ['static', 'boolean', 'single_use', 'continuous_use', 'credit_system'],
    };
  }

  /**
   * Replace enum references with literal unions
   */
  private replaceEnumsWithLiterals(schemaCode: string): string {
    const enumMap = this.getEnumValuesMap();
    let result = schemaCode;

    for (const [enumName, values] of Object.entries(enumMap)) {
      const literalUnion = values.map(v => `z.literal("${v}")`).join(', ');
      const pattern = new RegExp(`z\\.enum\\(${enumName}\\)`, 'g');
      result = result.replace(pattern, `z.union([${literalUnion}])`);
    }

    return result;
  }

  /**
   * Detect required imports from schema code
   */
  private detectRequiredImports(schemaCode: string): string {
    const imports: string[] = [];

    if (schemaCode.includes('UsageTierSchema')) {
      imports.push(`export const UsageTierSchema = z.object({\n  to: z.union([z.number(), z.literal("inf")]),\n  amount: z.number(),\n});`);
    }
    if (schemaCode.includes('idRegex')) {
      imports.push(`const idRegex = /^[a-zA-Z0-9_-]+$/;`);
    }

    return imports.length > 0 ? '\n' + imports.join('\n\n') + '\n' : '';
  }

  /**
   * Generate a single type based on configuration
   */
  private generateSingleType(config: TypeConfig): void {
    // Ensure output directory exists
    const outputDir = path.dirname(config.targetFile);
    if (!existsSync(outputDir)) {
      mkdirSync(outputDir, { recursive: true });
    }

    // EXISTING: TypeScript interface → Zod schema (for autumn-js)
    generateCamelZod({
      inputFile: config.sourceFile,
      typeName: config.sourceName,
      outputFile: config.targetFile,
      camelCase: true,
      omitFields: config.omitFields,
      extendFields: config.extendFields,
    });
  }

  /**
   * Generate an index file that exports all generated types
   */
  private async generateIndexFile(configs: TypeConfig[], outputDir: string): Promise<void> {
    const indexPath = path.join(this.targetPath, outputDir, "index.ts");
    
    const exports = configs.map(config => {
      const fileName = path.basename(config.targetFile, '.ts');
      return `export * from './${fileName}';`;
    }).join('\n');

    const content = `// Auto-generated exports for all camelCase types
// This file is generated by typegen pipeline
// DO NOT EDIT MANUALLY - changes will be overwritten

${exports}
`;

    writeFileSync(indexPath, content);
    // Removed verbose index file log
  }

  /**
   * Print a summary of the generation process
   */
  private printSummary(
    results: { config: TypeConfig; success: boolean; error?: string }[], 
    duration?: number
  ): void {
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => r.success === false).length;
    
    console.log(`📊 ${successful} successful, ${failed} failed (${duration}ms)`);
    
    if (failed > 0) {
      console.log(`\n❌ Failed generations:`);
      results.filter(r => !r.success).forEach(r => {
        console.log(`   - ${r.config.sourceName}: ${r.error}`);
      });
    }
  }
}