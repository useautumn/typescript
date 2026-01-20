#!/usr/bin/env tsx

import path from "node:path";
import {
	HookGenerator,
	MethodGenerator,
	TypeGenerator,
	TypeGeneratorUtils,
} from "./genUtils/index.js";
import {
	getAutumnJSHookConfigs,
	getAutumnJSMethodConfigs,
	getAutumnJSTypeConfigs,
} from "./typeConfigs.js";

/**
 * Generate camelCase types for autumn-js from @ts-sdk
 *
 * This script converts snake_case SDK types to camelCase Zod schemas
 * for use in the autumn-js React library.
 *
 * Configuration is defined in ./typeConfigs.ts - check there to see
 * exactly which types are being generated.
 */
async function main() {
	const startTime = Date.now();
	console.log("🎯 Generating camelCase types for autumn-js...\n");

	try {
		// Define paths relative to this script
		const tsSDKPath = path.resolve(__dirname, "../ts-sdk");
		const autumnJSPath = path.resolve(__dirname, "../package");

		// Validate all required paths exist
		TypeGeneratorUtils.validatePaths([
			{ name: "@ts-sdk", path: tsSDKPath },
			{ name: "package", path: autumnJSPath },
		]);

		// Generate parameter types
		const typeStart = Date.now();
		const typeConfig = getAutumnJSTypeConfigs(tsSDKPath, autumnJSPath);
		console.log(`📋 Generating ${typeConfig.configs.length} parameter types...`);
		const generator = new TypeGenerator(tsSDKPath, autumnJSPath);
		await generator.generateTypes(typeConfig);
		console.log(`   ⏱️  Types generated in ${Date.now() - typeStart}ms`);

		// Generate method signatures (useCustomer + useEntity)
		const methodStart = Date.now();
		console.log(`\n🔧 Generating method signatures...`);
		const methodConfigs = getAutumnJSMethodConfigs(tsSDKPath, autumnJSPath);
		const methodGenerator = new MethodGenerator(tsSDKPath, autumnJSPath);
		await methodGenerator.generateMethods(methodConfigs);
		console.log(`   ⏱️  Methods generated in ${Date.now() - methodStart}ms`);

		// Generate hook documentation
		const hookStart = Date.now();
		console.log(`\n📝 Generating hook documentation...`);
		const hookConfig = getAutumnJSHookConfigs(autumnJSPath);
		const hookGenerator = new HookGenerator(autumnJSPath);
		await hookGenerator.generateHookDocs(hookConfig);
		console.log(`   ⏱️  Hooks documented in ${Date.now() - hookStart}ms`);

		const totalTime = Date.now() - startTime;
		console.log(`\n✅ All type generation completed in ${totalTime}ms!`);
	} catch (error) {
		console.error("💥 autumn-js type generation failed:", error);
		process.exit(1);
	}
}

// Run immediately
main();
