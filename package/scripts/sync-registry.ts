#!/usr/bin/env tsx

import fs from 'fs/promises';
import path from 'path';
import { watch } from 'fs';

const REGISTRY_PATH = '../ui/registry';
const OUTPUT_PATH = './src/libraries/react/components';

interface ComponentConfig {
  registryName: string;
  outputName: string;
  dependencies?: string[];
}

const COMPONENTS: ComponentConfig[] = [
  {
    registryName: 'attach-dialog',
    outputName: 'attach-dialog',
    dependencies: ['attach-content']
  },
  {
    registryName: 'check-dialog', 
    outputName: 'check-dialog',
    dependencies: ['check-content']
  }
];

/**
 * Transform import paths from registry format to library format
 */
function transformImports(content: string): string {
  // Transform registry imports to local lib imports
  content = content.replace(
    /@\/registry\/([^\/]+)\/lib\/([^"']+)/g, 
    './lib/$2'
  );
  
  // Transform autumn-js imports to use our path aliases
  content = content.replace(
    /from ["']autumn-js\/react["']/g,
    "from '@/index'"
  );
  content = content.replace(
    /from ["']autumn-js["']/g,
    "from '@sdk'"
  );
  
  // Keep @/components/ui and @/lib imports as-is since they work with our path aliases
  
  return content;
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
    const mainFilePath = path.join(registryDir, `${config.registryName}.tsx`);
    const mainContent = await fs.readFile(mainFilePath, 'utf-8');
    const transformedMain = transformImports(mainContent);
    
    await fs.writeFile(
      path.join(outputDir, `${config.registryName}-synced.tsx`),
      transformedMain
    );
    
    // Copy lib dependencies if they exist
    if (config.dependencies) {
      const libDir = path.join(registryDir, 'lib');
      const outputLibDir = path.join(outputDir, 'lib');
      
      try {
        await fs.mkdir(outputLibDir, { recursive: true });
        
        for (const dep of config.dependencies) {
          const depPath = path.join(libDir, `${dep}.tsx`);
          const depContent = await fs.readFile(depPath, 'utf-8');
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
 * Update the library index to export synced components
 */
async function updateLibraryIndex(): Promise<void> {
  const indexPath = path.join(OUTPUT_PATH, '../index.ts');
  let currentContent = await fs.readFile(indexPath, 'utf-8');
  
  // Remove existing auto-synced section
  currentContent = currentContent.replace(/\n\n\/\/ Auto-synced components\n[\s\S]*$/g, '');
  
  // Add exports for synced components
  const newExports = COMPONENTS.map(config => {
    const exportName = config.outputName.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join('');
    return `export { default as ${exportName} } from "./components/${config.outputName}/${config.registryName}-synced";`;
  }).join('\n');
  
  const updatedContent = currentContent + '\n\n// Auto-synced components\n' + newExports;
  await fs.writeFile(indexPath, updatedContent);
  console.log('✅ Updated library index exports');
}

/**
 * Sync all components
 */
async function syncAll(): Promise<void> {
  console.log('🔄 Syncing registry components...');
  
  for (const component of COMPONENTS) {
    await syncComponent(component);
  }
  
  await updateLibraryIndex();
  console.log('🎉 Sync complete!');
}

/**
 * Watch for changes and auto-sync
 */
function watchRegistry(): void {
  console.log('👀 Watching registry for changes...');
  
  watch(REGISTRY_PATH, { recursive: true }, (_, filename) => {
    if (filename && filename.endsWith('.tsx')) {
      console.log(`📝 Detected change: ${filename}`);
      syncAll().catch(console.error);
    }
  });
}

// CLI interface
const command = process.argv[2];

switch (command) {
  case 'sync':
    syncAll().catch(console.error);
    break;
  case 'watch':
    syncAll().then(() => watchRegistry()).catch(console.error);
    break;
  default:
    console.log('Usage: tsx sync-registry.ts [sync|watch]');
    console.log('  sync  - Sync once');
    console.log('  watch - Sync and watch for changes');
}