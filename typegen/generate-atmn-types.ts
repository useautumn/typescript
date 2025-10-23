#!/usr/bin/env tsx

import path from "node:path";
import dotenv from "dotenv";
import { writeFileSync } from "fs";
import { TypeGenerator, TypeGeneratorUtils, generateBuilderFunctionsFile, extractZodSchema } from "./genUtils/index.js";
import { getAtmnTypeConfigs } from "./typeConfigs.js";
import { generatePlanFeatureDiscriminatedUnion, generatePlanTypeWithJSDoc } from "./genUtils/atmnTypeHelpers.js";

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
			const planFeatureSourceFile = path.join(serverPath, "api/products/planFeature/planFeatureOpModels.ts");
			const { metaDescriptions: planFeatureMeta } = extractZodSchema(planFeatureSourceFile, "UpdatePlanFeatureSchema");

			// Extract from Plan schema for Plan type JSDoc
			const planSourceFile = path.join(serverPath, "api/products/planOpModels.ts");
			const { metaDescriptions: planMeta } = extractZodSchema(planSourceFile, "CreatePlanParamsSchema");

			// Generate manual type unions with JSDoc
			const planModelsFile = path.join(atmnPath, "source/compose/models/planModels.ts");
			const planFeatureUnion = generatePlanFeatureDiscriminatedUnion(planFeatureMeta);
			const planType = generatePlanTypeWithJSDoc(planMeta);

			// Read existing content and append
			const fs = await import("fs");
			const existingContent = fs.readFileSync(planModelsFile, "utf-8");
			const newContent = existingContent + "\n" + planFeatureUnion + "\n" + planType + "\n";
			fs.writeFileSync(planModelsFile, newContent);

			console.log(`   📝 Added discriminated unions with JSDoc`);
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

		const totalTime = Date.now() - startTime;
		console.log(`\n✅ All type generation completed in ${totalTime}ms!`);
		console.log(
			`\n📝 Generated files:\n   - source/compose/models/planModels.ts\n   - source/compose/models/featureModels.ts\n   - source/compose/builders/builderFunctions.ts`,
		);
	} catch (error) {
		console.error("💥 atmn type generation failed:", error);
		process.exit(1);
	}
}

// Run immediately
main();
