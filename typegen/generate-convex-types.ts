#!/usr/bin/env tsx

import path from "node:path";
import { ConvexValidatorGenerator } from "./genUtils/ConvexValidatorGenerator.js";
import { getConvexValidatorConfigs } from "./convexTypeConfigs.js";
import { TypeGeneratorUtils } from "./genUtils/index.js";

/**
 * Generate Convex v.object() validators from @ts-sdk
 *
 * This script converts snake_case SDK types to camelCase Convex validators
 * for use in the @useautumn/convex package.
 *
 * Configuration is defined in ./convexTypeConfigs.ts
 */
async function main() {
	const startTime = Date.now();
	console.log("🎯 Generating Convex validators...\n");

	try {
		// Define paths relative to this script
		const tsSDKPath = path.resolve(__dirname, "../ts-sdk");
		const convexPath = path.resolve(__dirname, "../convex");

		// Validate all required paths exist
		TypeGeneratorUtils.validatePaths([
			{ name: "@ts-sdk", path: tsSDKPath },
			{ name: "@useautumn/convex", path: convexPath },
		]);

		// Get validator configurations
		const configs = getConvexValidatorConfigs(tsSDKPath, convexPath);
		console.log(`📋 Generating ${configs.length} Convex validators...`);

		// Define output path
		const outputPath = path.join(convexPath, "src/types.ts");

		// Generate validators
		const generator = new ConvexValidatorGenerator();
		await generator.generateValidators(configs, outputPath);

		const totalTime = Date.now() - startTime;
		console.log(`\n✅ Convex validator generation completed in ${totalTime}ms!`);
	} catch (error) {
		console.error("💥 Convex validator generation failed:", error);
		process.exit(1);
	}
}

// Run immediately
main();
