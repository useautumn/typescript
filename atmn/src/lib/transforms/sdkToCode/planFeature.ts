import type {
	Feature,
	PlanFeature,
} from "../../../../source/compose/models/index.js";
import { idToVarName, formatValue } from "./helpers.js";

/**
 * Generate TypeScript code for a plan feature configuration
 * 
 * @param planFeature The plan feature to generate code for
 * @param features List of features (used for future variable name lookup)
 * @param featureVarMap Optional map of feature ID -> variable name for preserving local names
 */
export function buildPlanFeatureCode(
	planFeature: PlanFeature,
	features: Feature[],
	featureVarMap?: Map<string, string>,
): string {
	// Use the variable map if provided, otherwise use string literal
	// This ensures generated code always works, even if variable names differ
	const featureVarName = featureVarMap?.get(planFeature.feature_id);
	const featureIdCode = featureVarName
		? `${featureVarName}.id`
		: `'${planFeature.feature_id}'`;

	const lines: string[] = [];
	lines.push(`\t\tplanFeature({`);
	lines.push(`\t\t\tfeature_id: ${featureIdCode},`);

	// Add included (granted_balance)
	if (planFeature.included !== undefined) {
		lines.push(`\t\t\tincluded: ${planFeature.included},`);
	}

	// Add unlimited
	if (planFeature.unlimited !== undefined) {
		lines.push(`\t\t\tunlimited: ${planFeature.unlimited},`);
	}

	// Add reset object (nested)
	if (planFeature.reset) {
		lines.push(`\t\t\treset: {`);
		if (planFeature.reset.interval) {
			lines.push(`\t\t\t\tinterval: '${planFeature.reset.interval}',`);
		}
		if (planFeature.reset.interval_count !== undefined) {
			lines.push(`\t\t\t\tinterval_count: ${planFeature.reset.interval_count},`);
		}
		lines.push(`\t\t\t},`);
	}

	// Add price
	if (planFeature.price) {
		lines.push(`\t\t\tprice: {`);

		if (planFeature.price.amount !== undefined) {
			lines.push(`\t\t\t\tamount: ${planFeature.price.amount},`);
		}

		if (planFeature.price.tiers) {
			const tiersCode = formatValue(planFeature.price.tiers);
			lines.push(`\t\t\t\ttiers: ${tiersCode},`);
		}

		if (planFeature.price.billing_units !== undefined) {
			lines.push(`\t\t\t\tbilling_units: ${planFeature.price.billing_units},`);
		}

		if (planFeature.price.billing_method) {
			lines.push(
				`\t\t\t\tbilling_method: '${planFeature.price.billing_method}',`,
			);
		}

		if (planFeature.price.max_purchase !== undefined) {
			lines.push(`\t\t\t\tmax_purchase: ${planFeature.price.max_purchase},`);
		}

		// Handle price.interval and price.interval_count (from PriceWithInterval type)
		const priceWithInterval = planFeature.price as { interval?: string; interval_count?: number };

		if (priceWithInterval.interval) {
			lines.push(`\t\t\t\tinterval: '${priceWithInterval.interval}',`);
		}

		if (priceWithInterval.interval_count !== undefined) {
			lines.push(`\t\t\t\tinterval_count: ${priceWithInterval.interval_count},`);
		}

		lines.push(`\t\t\t},`);
	}

	// Add proration
	if (planFeature.proration) {
		lines.push(`\t\t\tproration: ${formatValue(planFeature.proration)},`);
	}

	// Add rollover
	if (planFeature.rollover) {
		lines.push(`\t\t\trollover: ${formatValue(planFeature.rollover)},`);
	}

	lines.push(`\t\t}),`);

	return lines.join("\n");
}
