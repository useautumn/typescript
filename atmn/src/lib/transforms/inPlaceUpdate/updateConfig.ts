/**
 * Update autumn.config.ts in place while preserving comments and order
 * 
 * Uses line-based parsing for reliability
 */

import { writeFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import type { Feature, Plan } from "../../../../source/compose/models/index.js";
import { parseExistingConfig, type ParsedBlock } from "./parseConfig.js";
import { buildFeatureCode } from "../sdkToCode/feature.js";
import { buildPlanCode } from "../sdkToCode/plan.js";

export interface UpdateResult {
	/** Number of features updated in place */
	featuresUpdated: number;
	/** Number of features added */
	featuresAdded: number;
	/** Number of features deleted (not in API) */
	featuresDeleted: number;
	/** Number of plans updated in place */
	plansUpdated: number;
	/** Number of plans added */
	plansAdded: number;
	/** Number of plans deleted (not in API) */
	plansDeleted: number;
}

/**
 * Generate code for a feature, using the existing variable name if provided
 */
function generateFeatureCode(feature: Feature, existingVarName?: string): string {
	const code = buildFeatureCode(feature);
	if (existingVarName) {
		// Replace the generated variable name with the existing one
		return code.replace(/export const \w+/, `export const ${existingVarName}`);
	}
	return code;
}

/**
 * Generate code for a plan, using the existing variable name if provided
 * 
 * @param featureVarMap Map of feature ID -> variable name for preserving local feature references
 */
function generatePlanCode(
	plan: Plan, 
	features: Feature[], 
	existingVarName?: string,
	featureVarMap?: Map<string, string>,
): string {
	const code = buildPlanCode(plan, features, featureVarMap);
	if (existingVarName) {
		// Replace the generated variable name with the existing one
		return code.replace(/export const \w+/, `export const ${existingVarName}`);
	}
	return code;
}

/**
 * Update autumn.config.ts in place
 * 
 * Strategy:
 * 1. Parse existing config into blocks (imports, comments, exports)
 * 2. For each entity in API data:
 *    - If exists locally: replace with new code (preserving var name)
 *    - If new: append to the appropriate section
 * 3. Entities that exist locally but not in API are DELETED
 */
export async function updateConfigInPlace(
	features: Feature[],
	plans: Plan[],
	cwd: string = process.cwd(),
): Promise<UpdateResult> {
	const configPath = resolve(cwd, "autumn.config.ts");
	
	if (!existsSync(configPath)) {
		throw new Error(`Config file not found: ${configPath}`);
	}
	
	const parsed = parseExistingConfig(configPath);
	const result: UpdateResult = {
		featuresUpdated: 0,
		featuresAdded: 0,
		featuresDeleted: 0,
		plansUpdated: 0,
		plansAdded: 0,
		plansDeleted: 0,
	};
	
	// Build lookup maps
	const apiFeatureMap = new Map(features.map(f => [f.id, f]));
	const apiPlanMap = new Map(plans.map(p => [p.id, p]));
	
	// Build feature ID -> variable name map from parsed entities
	// This allows us to preserve local variable names when generating plan code
	const featureVarMap = new Map<string, string>();
	for (const entity of parsed.entities) {
		if (entity.type === "feature") {
			featureVarMap.set(entity.id, entity.varName);
		}
	}
	
	// Track which API entities have been matched
	const matchedFeatureIds = new Set<string>();
	const matchedPlanIds = new Set<string>();
	
	// Build new file content block by block
	const outputBlocks: string[] = [];
	
	// Track if we've seen features/plans sections for inserting new ones
	let lastFeatureBlockIndex = -1;
	let lastPlanBlockIndex = -1;
	let sawFeaturesComment = false;
	let sawPlansComment = false;
	
	for (let i = 0; i < parsed.blocks.length; i++) {
		const block = parsed.blocks[i];
		
		// Track section comments
		if (block.type === "comment") {
			const commentText = block.lines.join("\n").toLowerCase();
			if (commentText.includes("feature")) {
				sawFeaturesComment = true;
			}
			if (commentText.includes("plan")) {
				sawPlansComment = true;
			}
			outputBlocks.push(block.lines.join("\n"));
			continue;
		}
		
		// Keep imports and other blocks as-is
		if (block.type === "import" || block.type === "other") {
			outputBlocks.push(block.lines.join("\n"));
			continue;
		}
		
		// Handle export blocks (features/plans)
		if (block.type === "export" && block.entity) {
			const entity = block.entity;
			
			if (entity.type === "feature") {
				const apiFeature = apiFeatureMap.get(entity.id);
				if (apiFeature) {
					// Update existing feature
					const newCode = generateFeatureCode(apiFeature, entity.varName);
					outputBlocks.push(newCode);
					matchedFeatureIds.add(entity.id);
					lastFeatureBlockIndex = outputBlocks.length - 1;
					result.featuresUpdated++;
				} else {
					// Feature not in API - delete it (don't add to output)
					result.featuresDeleted++;
				}
			} else if (entity.type === "plan") {
				const apiPlan = apiPlanMap.get(entity.id);
				if (apiPlan) {
					// Update existing plan
					const newCode = generatePlanCode(apiPlan, features, entity.varName, featureVarMap);
					outputBlocks.push(newCode);
					matchedPlanIds.add(entity.id);
					lastPlanBlockIndex = outputBlocks.length - 1;
					result.plansUpdated++;
				} else {
					// Plan not in API - delete it (don't add to output)
					result.plansDeleted++;
				}
			}
			continue;
		}
		
		// Fallback - keep block as-is
		outputBlocks.push(block.lines.join("\n"));
	}
	
	// Add new features (in API but not in local config)
	const newFeatures = features.filter(f => !matchedFeatureIds.has(f.id));
	if (newFeatures.length > 0) {
		const newFeatureCode = newFeatures.map(f => generateFeatureCode(f)).join("\n\n");
		
		if (lastFeatureBlockIndex >= 0) {
			// Insert after last feature
			outputBlocks.splice(lastFeatureBlockIndex + 1, 0, newFeatureCode);
			lastPlanBlockIndex++; // Adjust plan index since we inserted
		} else if (sawFeaturesComment) {
			// Find features comment and insert after
			for (let i = 0; i < outputBlocks.length; i++) {
				if (outputBlocks[i].toLowerCase().includes("feature") && 
				    (outputBlocks[i].trim().startsWith("//") || outputBlocks[i].trim().startsWith("/*"))) {
					outputBlocks.splice(i + 1, 0, newFeatureCode);
					lastPlanBlockIndex++; // Adjust
					break;
				}
			}
		} else {
			// Insert after imports
			let insertIdx = 0;
			for (let i = 0; i < outputBlocks.length; i++) {
				if (outputBlocks[i].trim().startsWith("import ")) {
					insertIdx = i + 1;
				}
			}
			outputBlocks.splice(insertIdx, 0, "\n// Features\n" + newFeatureCode);
			lastPlanBlockIndex++; // Adjust
		}
		result.featuresAdded = newFeatures.length;
	}
	
	// Add new plans (in API but not in local config)
	const newPlans = plans.filter(p => !matchedPlanIds.has(p.id));
	if (newPlans.length > 0) {
		const newPlanCode = newPlans.map(p => generatePlanCode(p, features, undefined, featureVarMap)).join("\n\n");
		
		if (lastPlanBlockIndex >= 0) {
			// Insert after last plan
			outputBlocks.splice(lastPlanBlockIndex + 1, 0, newPlanCode);
		} else if (sawPlansComment) {
			// Find plans comment and insert after
			for (let i = 0; i < outputBlocks.length; i++) {
				if (outputBlocks[i].toLowerCase().includes("plan") && 
				    (outputBlocks[i].trim().startsWith("//") || outputBlocks[i].trim().startsWith("/*"))) {
					outputBlocks.splice(i + 1, 0, newPlanCode);
					break;
				}
			}
		} else {
			// Append at end with section comment
			outputBlocks.push("\n// Plans\n" + newPlanCode);
		}
		result.plansAdded = newPlans.length;
	}
	
	// Join blocks with proper spacing
	// Comments directly before exports should not have extra blank line between them
	const filteredBlocks = outputBlocks.filter(b => b.trim() !== "");
	const outputLines: string[] = [];
	
	for (let i = 0; i < filteredBlocks.length; i++) {
		const block = filteredBlocks[i];
		const nextBlock = filteredBlocks[i + 1];
		
		outputLines.push(block);
		
		// Add blank line UNLESS this is a comment and next is an export
		// (comments directly above exports should have no gap)
		const isComment = block.trim().startsWith("//") || block.trim().startsWith("/*");
		const nextIsExport = nextBlock?.trim().startsWith("export ");
		
		if (i < filteredBlocks.length - 1 && !(isComment && nextIsExport)) {
			outputLines.push("");
		}
	}
	
	const output = outputLines.join("\n") + "\n";
	
	// Write the updated file
	writeFileSync(configPath, output, "utf-8");
	
	return result;
}
