import type { Feature } from "../../../../source/compose/models/featureModels.js";
import { featureIdToVarName, formatValue } from "./helpers.js";

/**
 * Generate TypeScript code for a feature definition
 * 
 * Rules:
 * - Boolean features: No consumable field
 * - Metered features: MUST output consumable: true or false explicitly
 * - Credit system features: Don't output consumable (implied true)
 */
export function buildFeatureCode(feature: Feature): string {
	const varName = featureIdToVarName(feature.id);
	const lines: string[] = [];

	lines.push(`export const ${varName} = feature({`);
	lines.push(`\tid: '${feature.id}',`);
	lines.push(`\tname: '${feature.name}',`);
	lines.push(`\ttype: '${feature.type}',`);

	// Metered features MUST have explicit consumable field
	// consumable: true = single_use (usage is consumed)
	// consumable: false = continuous_use (usage accumulates, like seats)
	if (feature.type === "metered") {
		lines.push(`\tconsumable: ${feature.consumable},`);
	}

	// Add event_names if present
	if (feature.event_names && feature.event_names.length > 0) {
		lines.push(`\tevent_names: ${formatValue(feature.event_names)},`);
	}

	// Add credit_schema for credit_system features
	if (feature.type === "credit_system" && feature.credit_schema) {
		lines.push(`\tcredit_schema: ${formatValue(feature.credit_schema)},`);
	}

	lines.push(`});`);

	return lines.join("\n");
}
