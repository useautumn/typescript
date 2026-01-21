import type {
	Feature,
	Plan,
} from "../../../../source/compose/models/index.js";
import { planIdToVarName, formatValue } from "./helpers.js";
import { buildPlanFeatureCode } from "./planFeature.js";

/**
 * Generate TypeScript code for a plan definition
 * 
 * @param plan The plan to generate code for
 * @param features List of features
 * @param featureVarMap Optional map of feature ID -> variable name for preserving local names
 */
export function buildPlanCode(
	plan: Plan, 
	features: Feature[],
	featureVarMap?: Map<string, string>,
): string {
	const varName = planIdToVarName(plan.id);
	const lines: string[] = [];

	lines.push(`export const ${varName} = plan({`);
	lines.push(`\tid: '${plan.id}',`);
	lines.push(`\tname: '${plan.name}',`);

	// Add description
	if (plan.description !== undefined && plan.description !== null) {
		lines.push(`\tdescription: '${plan.description}',`);
	}

	// Add group (only if it has a non-empty string value)
	// undefined and null both mean "no group" and should be omitted from generated code
	if (plan.group !== undefined && plan.group !== null && plan.group !== "") {
		lines.push(`\tgroup: '${plan.group}',`);
	}

	// Add add_on (only if true - false becomes undefined via swapFalse)
	if (plan.add_on !== undefined) {
		lines.push(`\tadd_on: ${plan.add_on},`);
	}

	// Add auto_enable (only if true - false becomes undefined via swapFalse)
	if (plan.auto_enable !== undefined) {
		lines.push(`\tauto_enable: ${plan.auto_enable},`);
	}

	// Add price
	if (plan.price) {
		lines.push(`\tprice: {`);
		lines.push(`\t\tamount: ${plan.price.amount},`);
		lines.push(`\t\tinterval: '${plan.price.interval}',`);
		lines.push(`\t},`);
	}

	// Add features
	if (plan.features && plan.features.length > 0) {
		lines.push(`\tfeatures: [`);
		for (const planFeature of plan.features) {
			const featureCode = buildPlanFeatureCode(planFeature, features, featureVarMap);
			lines.push(featureCode);
		}
		lines.push(`\t],`);
	}

	// Add free_trial
	if (plan.free_trial) {
		lines.push(`\tfree_trial: ${formatValue(plan.free_trial)},`);
	}

	lines.push(`});`);

	return lines.join("\n");
}
