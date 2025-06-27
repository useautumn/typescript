#!/usr/bin/env tsx

import fs from "fs/promises";
import path from "path";
import { watch } from "fs";

const REGISTRY_PATH = "../ui/registry";
const OUTPUT_PATH = "./src/libraries/react/components";

interface ComponentConfig {
  registryName: string;
  outputName: string;
  dependencies?: string[];
}

const COMPONENTS: ComponentConfig[] = [
  {
    registryName: "attach-dialog",
    outputName: "attach-dialog",
    dependencies: ["attach-content"],
  },
  {
    registryName: "check-dialog",
    outputName: "check-dialog",
    dependencies: ["check-content"],
  },
  {
    registryName: "pricing-table",
    outputName: "pricing-table",
    dependencies: ["pricing-table-content"],
  },
];

/**
 * Transform import paths from registry format to library format
 */
function transformImports(content: string): string {
  // Transform registry-specific lib imports (but NOT @/lib/utils)
  content = content.replace(
    /@\/registry\/([^\/]+)\/lib\/([^"']+)/g,
    "./lib/$2"
  );

  // Transform registry component imports to use synced versions
  content = content.replace(
    /@\/registry\/([^\/]+)\/([^"']+)/g,
    "../$1/$1-synced"
  );

  // Transform autumn-js imports to use our path aliases
  content = content.replace(/from ["']autumn-js\/react["']/g, "from '@/index'");
  content = content.replace(/from ["']autumn-js["']/g, "from '@sdk'");

  // Keep @/components/ui and @/lib imports as-is since they work with our path aliases

  return content;
}

/**
 * Transform import paths from library format back to registry format
 */
function reverseTransformImports(content: string): string {
  // Transform our path aliases back to autumn-js imports
  content = content.replace(/from ["']@\/index["']/g, 'from "autumn-js/react"');
  content = content.replace(/from ["']@sdk["']/g, 'from "autumn-js"');

  // Transform synced component imports back to registry format
  content = content.replace(
    /from ["']..\/([^\/]+)\/\1-synced["']/g,
    'from "@/registry/$1/$1"'
  );

  // Transform component-specific lib imports back to registry format (excluding utils)
  content = content.replace(
    /from ["'].\/lib\/(?!utils)([^"']+)["']/g,
    'from "@/registry/' + getCurrentComponentName() + '/lib/$1"'
  );

  // Keep @/lib/utils and @/components/ui imports as-is (don't transform these)
  // ./lib/utils should stay as @/lib/utils

  return content;
}

let currentComponentName = '';
function getCurrentComponentName(): string {
  return currentComponentName;
}

/**
 * Copy and transform a single component
 */
async function syncComponent(config: ComponentConfig): Promise<void> {
  const registryDir = path.join(REGISTRY_PATH, config.registryName);
  const outputDir = path.join(OUTPUT_PATH, config.outputName);

  try {
    // Create output directory
    await fs.mkdir(outputDir, { recursive: true });

    // Copy main component file
    let mainFilePath = path.join(registryDir, `${config.registryName}.tsx`);
    
    // Check if file exists in subdirectory (for pricing-table structure)
    try {
      await fs.access(mainFilePath);
    } catch {
      mainFilePath = path.join(registryDir, config.registryName, `${config.registryName}.tsx`);
    }
    
    const mainContent = await fs.readFile(mainFilePath, "utf-8");
    const transformedMain = transformImports(mainContent);

    await fs.writeFile(
      path.join(outputDir, `${config.registryName}-synced.tsx`),
      transformedMain
    );

    // Copy lib dependencies if they exist
    if (config.dependencies) {
      const libDir = path.join(registryDir, "lib");
      const outputLibDir = path.join(outputDir, "lib");

      try {
        await fs.mkdir(outputLibDir, { recursive: true });

        for (const dep of config.dependencies) {
          const depPath = path.join(libDir, `${dep}.tsx`);
          const depContent = await fs.readFile(depPath, "utf-8");
          const transformedDep = transformImports(depContent);

          await fs.writeFile(
            path.join(outputLibDir, `${dep}.tsx`),
            transformedDep
          );
        }
      } catch (error) {
        console.warn(`No lib directory found for ${config.registryName}`);
      }
    }

    console.log(`✅ Synced ${config.registryName} -> ${config.outputName}`);
  } catch (error) {
    console.error(`❌ Failed to sync ${config.registryName}:`, error);
  }
}

/**
 * Reverse sync a single component from library back to registry
 */
async function reverseSyncComponent(config: ComponentConfig): Promise<void> {
  const registryDir = path.join(REGISTRY_PATH, config.registryName);
  const outputDir = path.join(OUTPUT_PATH, config.outputName);
  
  currentComponentName = config.registryName;

  try {
    // Read the synced component file
    const syncedFilePath = path.join(outputDir, `${config.registryName}-synced.tsx`);
    const syncedContent = await fs.readFile(syncedFilePath, "utf-8");
    const reverseTransformed = reverseTransformImports(syncedContent);

    // Determine the target path (handle subdirectory structure)
    let targetFilePath = path.join(registryDir, `${config.registryName}.tsx`);
    
    // Check if registry uses subdirectory structure
    try {
      await fs.access(path.join(registryDir, config.registryName, `${config.registryName}.tsx`));
      targetFilePath = path.join(registryDir, config.registryName, `${config.registryName}.tsx`);
    } catch {
      // Use the direct path
    }

    await fs.writeFile(targetFilePath, reverseTransformed);

    // Reverse sync lib dependencies if they exist
    if (config.dependencies) {
      const outputLibDir = path.join(outputDir, "lib");
      const libDir = path.join(registryDir, "lib");

      try {
        for (const dep of config.dependencies) {
          const syncedDepPath = path.join(outputLibDir, `${dep}.tsx`);
          const syncedDepContent = await fs.readFile(syncedDepPath, "utf-8");
          const reverseTransformedDep = reverseTransformImports(syncedDepContent);

          await fs.writeFile(
            path.join(libDir, `${dep}.tsx`),
            reverseTransformedDep
          );
        }
      } catch (error) {
        console.warn(`No lib directory found for synced ${config.registryName}`);
      }
    }

    console.log(`🔄 Reverse synced ${config.outputName} -> ${config.registryName}`);
  } catch (error) {
    console.error(`❌ Failed to reverse sync ${config.registryName}:`, error);
  }
}

/**
 * Update the library index to export synced components
 */
async function updateLibraryIndex(): Promise<void> {
  const indexPath = path.join(OUTPUT_PATH, "../index.ts");
  let currentContent = await fs.readFile(indexPath, "utf-8");

  // Remove existing auto-synced section
  currentContent = currentContent.replace(
    /\n\n\/\/ Auto-synced components\n[\s\S]*$/g,
    ""
  );

  // Add exports for synced components
  const newExports = COMPONENTS.map((config) => {
    const exportName = config.outputName
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join("");
    return `export { default as ${exportName} } from "./components/${config.outputName}/${config.registryName}-synced";`;
  }).join("\n");

  const updatedContent =
    currentContent + "\n\n// Auto-synced components\n" + newExports;
  await fs.writeFile(indexPath, updatedContent);
  console.log("✅ Updated library index exports");
}

/**
 * Sync all components
 */
async function syncAll(): Promise<void> {
  console.log("🔄 Syncing registry components...");

  for (const component of COMPONENTS) {
    await syncComponent(component);
  }

  await updateLibraryIndex();
  console.log("🎉 Sync complete!");
}

/**
 * Reverse sync all components
 */
async function reverseSyncAll(): Promise<void> {
  console.log("🔄 Reverse syncing components back to registry...");

  for (const component of COMPONENTS) {
    await reverseSyncComponent(component);
  }

  console.log("🎉 Reverse sync complete!");
}

/**
 * Watch for changes and auto-sync
 */
function watchRegistry(): void {
  console.log("👀 Watching registry for changes...");

  watch(REGISTRY_PATH, { recursive: true }, (_, filename) => {
    if (filename && filename.endsWith(".tsx")) {
      console.log(`📝 Detected change: ${filename}`);
      syncAll().catch(console.error);
    }
  });
}

// CLI interface
const command = process.argv[2];

switch (command) {
  case "sync":
    syncAll().catch(console.error);
    break;
  case "reverse":
    reverseSyncAll().catch(console.error);
    break;
  case "watch":
    syncAll()
      .then(() => watchRegistry())
      .catch(console.error);
    break;
  default:
    console.log("Usage: tsx sync-registry.ts [sync|reverse|watch]");
    console.log("  sync     - Sync from registry to library");
    console.log("  reverse  - Sync from library back to registry");
    console.log("  watch    - Sync and watch for changes");
}
