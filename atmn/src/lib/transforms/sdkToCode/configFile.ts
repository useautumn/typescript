import type {
	Feature,
	Plan,
} from "../../../../source/compose/models/index.js";
import { buildImports } from "./imports.js";
import { buildFeatureCode } from "./feature.js";
import { buildPlanCode } from "./plan.js";

/**
 * Generate complete autumn.config.ts file content
 */
export function buildConfigFile(features: Feature[], plans: Plan[]): string {
	const sections: string[] = [];

	// Add imports
	sections.push(buildImports());
	sections.push("");

	// Add features
	if (features.length > 0) {
		sections.push("// Features");
		for (const feature of features) {
			sections.push(buildFeatureCode(feature));
			sections.push("");
		}
	}

	// Add plans
	if (plans.length > 0) {
		sections.push("// Plans");
		for (const plan of plans) {
			sections.push(buildPlanCode(plan, features));
			sections.push("");
		}
	}

	return sections.join("\n");
}
