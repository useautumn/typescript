import type {
	Feature,
	PlanFeature,
} from "../../../../source/compose/models/index.js";
import { idToVarName, formatValue } from "./helpers.js";

/**
 * Generate TypeScript code for a plan feature configuration
 */
export function buildPlanFeatureCode(
	planFeature: PlanFeature,
	features: Feature[],
): string {
	// Find the feature to get its variable name
	const feature = features.find((f) => f.id === planFeature.feature_id);
	const featureVarName = feature ? idToVarName(feature.id) : null;
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

	// Add reset fields (flattened)
	if (planFeature.interval) {
		lines.push(`\t\t\tinterval: '${planFeature.interval}',`);
	}
	if (planFeature.interval_count !== undefined) {
		lines.push(`\t\t\tinterval_count: ${planFeature.interval_count},`);
	}
	if (planFeature.carry_over_usage !== undefined) {
		lines.push(`\t\t\tcarry_over_usage: ${planFeature.carry_over_usage},`);
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
