#!/usr/bin/env tsx

import path from "path";
import { TypeGenerator, TypeGeneratorUtils } from "./genUtils";
import { getAutumnJSTypeConfigs } from "./typeConfigs";

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
  console.log("🎯 Generating camelCase types for autumn-js...\n");
  
  try {
    // Define paths relative to this script
    const tsSDKPath = path.resolve(__dirname, "../ts-sdk");
    const autumnJSPath = path.resolve(__dirname, "../autumn-js");
    
    // Validate all required paths exist
    TypeGeneratorUtils.validatePaths([
      { name: "@ts-sdk", path: tsSDKPath },
      { name: "autumn-js", path: autumnJSPath }
    ]);
    
    // Get type configurations
    const typeConfig = getAutumnJSTypeConfigs(tsSDKPath, autumnJSPath);
    
    console.log(`📋 Generating ${typeConfig.configs.length} types...`);
    
    // Generate all types
    const generator = new TypeGenerator(tsSDKPath, autumnJSPath);
    await generator.generateTypes(typeConfig);
    
    console.log("✅ Type generation completed!");
    
  } catch (error) {
    console.error("💥 autumn-js type generation failed:", error);
    process.exit(1);
  }
}

// Run immediately
main();