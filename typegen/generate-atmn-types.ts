#!/usr/bin/env tsx

import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import { writeFileSync, mkdirSync, readFileSync } from "fs";
import { TypeGenerator, TypeGeneratorUtils, generateBuilderFunctionsFile, extractZodSchema } from "./genUtils/index.js";
import { getAtmnTypeConfigs, getAtmnApiTypeConfigs } from "./typeConfigs.js";
import { generatePlanFeatureType, generatePlanTypeWithJSDoc, generateFeatureDiscriminatedUnion } from "./genUtils/atmnTypeHelpers.js";
import { generateApiTypeFile, generateApiTypesIndex } from "./genUtils/atmnApiTypeHelpers.js";
import { generatePreviewDisplayUtils } from "./genUtils/atmnPreviewHelpers.js";

// ESM-compatible __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Generate snake_case types for atmn CLI from @autumn/shared
 *
 * This script converts Zod schemas from the server to CLI-friendly types.
 * Unlike autumn-js which uses camelCase, atmn keeps snake_case.
 *
 * Configuration is defined in ./typeConfigs.ts - check getAtmnTypeConfigs()
 */
async function main() {
	const startTime = Date.now();
	console.log("🎯 Generating types for atmn CLI...\n");

	try {
		// Load environment variables from .env
		dotenv.config({ path: path.join(__dirname, '.env') });

		const serverPath = process.env.AUTUMN_SERVER_PATH;
		if (!serverPath) {
			throw new Error(
				'AUTUMN_SERVER_PATH env var not set.\n' +
				'Copy typegen/.env.example to typegen/.env and set the path to your Autumn server shared directory'
			);
		}

		// Define paths
		const atmnPath = path.resolve(__dirname, "../atmn");

		// Validate all required paths exist
		TypeGeneratorUtils.validatePaths([
			{ name: "Autumn server/shared", path: serverPath },
			{ name: "atmn", path: atmnPath },
		]);

		// Generate API response types first
		const apiStart = Date.now();
		console.log(`📡 Generating API response types...`);
		const apiConfigs = getAtmnApiTypeConfigs(serverPath, atmnPath);
		
		// Create output directory
		const apiTypesDir = path.join(atmnPath, "src/lib/api/types");
		mkdirSync(apiTypesDir, { recursive: true });
		
		// Generate each API type file
		for (const config of apiConfigs) {
			generateApiTypeFile(
				{
					schemaName: config.schemaName,
					typeName: config.typeName,
					sourceFile: config.sourceFile,
				},
				config.outputFile,
			);
		}
		
	// Generate index file
	const apiIndexConfigs = apiConfigs.map(c => ({
		typeName: c.typeName,
		outputFile: c.outputFile,
	}));
	generateApiTypesIndex(apiIndexConfigs, path.join(apiTypesDir, "index.ts"));
		
		// Manually create organization type (not generated from schema)
		const orgTypeFile = path.join(apiTypesDir, "organization.ts");
		writeFileSync(
			orgTypeFile,
			`// Manual type - not auto-generated

/**
 * Organization API response type
 */
export interface ApiOrganization {
	id: string;
	name: string;
	slug: string;
	stripe_connection?: string;
	created_at: number;
}
`,
			"utf-8",
		);
		
		console.log(`   ⏱️  API types generated in ${Date.now() - apiStart}ms`);
		console.log(`   📝 Generated: ApiPlan, ApiPlanFeature, ApiFeature, ApiOrganization`);

		// Get type generation configuration
		const typeConfig = getAtmnTypeConfigs(serverPath, atmnPath);

		// Generate parameter types (Plan, Feature, PlanFeature, FreeTrial)
		const typeStart = Date.now();
		console.log(`📋 Generating ${typeConfig.configs.length} type schemas...`);
		const generator = new TypeGenerator(serverPath, atmnPath);
		await generator.generateTypes(typeConfig);
		console.log(`   ⏱️  Types generated in ${Date.now() - typeStart}ms`);

		// Extract meta descriptions from PlanFeature schema for manual type generation
		const planFeatureConfig = typeConfig.configs.find(c => c.targetName === "PlanFeature");
		if (planFeatureConfig) {
			const planFeatureSourceFile = path.join(serverPath, "api/products/items/crud/createPlanItemParamsV1.ts");
			const { metaDescriptions: planFeatureMeta } = extractZodSchema(planFeatureSourceFile, "CreatePlanItemParamsV1Schema");

			// Extract from Plan schema for Plan type JSDoc
			const planSourceFile = path.join(serverPath, "api/products/crud/createPlanParamsV0.ts");
			const { metaDescriptions: planMeta } = extractZodSchema(planSourceFile, "CreatePlanParamsV1Schema");

			// Generate manual type unions with JSDoc
			const planModelsFile = path.join(atmnPath, "src/compose/models/planModels.ts");
			const planFeatureUnion = generatePlanFeatureType(planFeatureMeta);
			const planType = generatePlanTypeWithJSDoc(planMeta);

			// Read existing content and append
			const fs = await import("fs");
			const existingContent = fs.readFileSync(planModelsFile, "utf-8");
			const newContent = existingContent + "\n" + planFeatureUnion + "\n" + planType + "\n";
			fs.writeFileSync(planModelsFile, newContent);

			console.log(`   📝 Added Plan discriminated unions with JSDoc`);
		}

		// Add Feature discriminated union
		const featureConfig = typeConfig.configs.find(c => c.targetName === "Feature");
		if (featureConfig) {
			const featureModelsFile = path.join(atmnPath, "src/compose/models/featureModels.ts");
			const featureUnion = generateFeatureDiscriminatedUnion();

			const fs = await import("fs");
			const existingContent = fs.readFileSync(featureModelsFile, "utf-8");
			const newContent = existingContent + "\n" + featureUnion + "\n";
			fs.writeFileSync(featureModelsFile, newContent);

			console.log(`   📝 Added Feature discriminated unions with JSDoc`);
		}

		// Generate builder functions (plan(), feature(), planFeature())
		if (typeConfig.builders && typeConfig.builders.length > 0) {
			const builderStart = Date.now();
			console.log(`\n🔧 Generating ${typeConfig.builders.length} builder functions...`);

			// Collect imports for builders
			const imports = [
				{ typeName: "Plan, PlanFeature, FreeTrial", from: "../models/planModels.js" },
				{ typeName: "Feature", from: "../models/featureModels.js" },
			];

			// Generate the builders file
			const builderFile = typeConfig.builders[0]?.targetFile;
			if (builderFile) {
				generateBuilderFunctionsFile(typeConfig.builders, builderFile, imports);
				console.log(`   ⏱️  Builders generated in ${Date.now() - builderStart}ms`);
			}
		}

		// Generate preview display utilities (copied from @autumn/shared)
		const previewStart = Date.now();
		console.log(`\n🎨 Generating preview display utilities...`);
		generatePreviewDisplayUtils({ serverPath, atmnPath });
		console.log(`   ⏱️  Preview utils generated in ${Date.now() - previewStart}ms`);
		console.log(`   📝 Generated: displayUtils.ts, planFeatureToItem.ts`);

		const totalTime = Date.now() - startTime;
		console.log(`\n✅ All type generation completed in ${totalTime}ms!`);
		console.log(
			`\n📝 Generated files:\n   - src/lib/api/types/ (API response types)\n   - src/compose/models/planModels.ts\n   - src/compose/models/featureModels.ts\n   - src/compose/builders/builderFunctions.ts\n   - src/commands/preview/displayUtils.ts\n   - src/commands/preview/planFeatureToItem.ts`,
		);
	} catch (error) {
		console.error("💥 atmn type generation failed:", error);
		process.exit(1);
	}
}

// Run immediately
main();
