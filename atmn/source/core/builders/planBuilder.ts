// @ts-nocheck
import type { Feature, Plan } from "../../compose/index.js";
import { idToVar, notNullish, nullish } from "../utils.js";

export function importBuilder() {
	return `
import {
	feature,
	plan,
	planFeature,
} from 'atmn';
    `;
}

export function exportBuilder(planIds: string[], featureIds: string[]) {
	const snippet = `
const autumnConfig = {
    plans: [${planIds.map((id) => `${idToVar({ id, prefix: "plan" })}`).join(", ")}],
    features: [${featureIds.map((id) => `${idToVar({ id, prefix: "feature" })}`).join(", ")}]
}

export default autumnConfig;
    `;
	return snippet;
}

export function planBuilder({
	plan,
	features,
}: {
	plan: Plan;
	features: Feature[];
}) {
	// Plan from API has nested reset structure, cast to ApiPlanFeature for builder
	const planFeaturesStr =
		plan.features
			?.map((pf: any) =>
				planFeatureBuilder({ planFeature: pf as ApiPlanFeature, features }),
			)
			.join(",\n        ") || "";

	const priceStr = plan.price
		? `\n    price: {\n        amount: ${plan.price.amount},\n        interval: '${plan.price.interval}',\n    },`
		: "";

	const descriptionStr =
		plan.description && plan.description !== null
			? `\n    description: '${plan.description.replace(/'/g, "\\'")}',`
			: "";

	const groupStr =
		plan.group && plan.group !== "" && plan.group !== null
			? `\n    group: '${plan.group}',`
			: "";

	const addOnStr = plan.add_on === true ? `\n    add_on: true,` : "";

	const autoEnableStr = plan.default === true ? `\n    auto_enable: true,` : "";

	const freeTrialStr =
		plan.free_trial && plan.free_trial !== null
			? `\n    free_trial: {\n        duration_type: '${plan.free_trial.duration_type}',\n        duration_length: ${plan.free_trial.duration_length},\n        card_required: ${plan.free_trial.card_required},\n    },`
			: "";

	const snippet = `
export const ${idToVar({ id: plan.id, prefix: "plan" })} = plan({
    id: '${plan.id}',
    name: '${plan.name}',${descriptionStr}${groupStr}${addOnStr}${autoEnableStr}${priceStr}
    features: [
        ${planFeaturesStr}
    ],${freeTrialStr}
});
`;
	return snippet;
}

export const getFeatureIdStr = ({
	featureId,
	features,
}: {
	featureId: string;
	features: Feature[];
}) => {
	if (nullish(featureId)) return "";

	const feature = features.find((f) => f.id === featureId);

	if (feature?.archived) return `"${featureId}"`;
	return `${idToVar({ id: featureId, prefix: "feature" })}.id`;
};

// API PlanFeature type (what comes from server - has nested reset object)
type ApiPlanFeature = {
	feature_id: string;
	granted_balance?: number;
	unlimited?: boolean;
	reset?: {
		interval?: string;
		interval_count?: number;
		reset_when_enabled?: boolean;
	};
	price?: {
		amount?: number;
		tiers?: Array<{ to: number | "inf"; amount: number }>;
		interval?: string;
		interval_count?: number;
		billing_units?: number;
		usage_model?: string;
		max_purchase?: number;
	};
	proration?: {
		on_increase?: string;
		on_decrease?: string;
	};
	rollover?: {
		max?: number;
		expiry_duration_type?: string;
		expiry_duration_length?: number;
	};
};

// Plan Feature Builder - transforms API response to SDK format (flattened)
function planFeatureBuilder({
	planFeature,
	features,
}: {
	planFeature: ApiPlanFeature;
	features: Feature[];
}) {
	const featureIdStr = getFeatureIdStr({
		featureId: planFeature.feature_id,
		features,
	});

	const parts: string[] = [`feature_id: ${featureIdStr}`];

	// Included usage (API: granted_balance -> SDK: included)
	if (
		notNullish(planFeature.granted_balance) &&
		planFeature.granted_balance > 0
	) {
		parts.push(`included: ${planFeature.granted_balance}`);
	}

	// Unlimited (only if true)
	if (planFeature.unlimited === true) {
		parts.push(`unlimited: true`);
	}

	// Flattened reset fields (API: reset.interval -> SDK: interval at top level)
	if (planFeature.reset?.interval) {
		parts.push(`interval: '${planFeature.reset.interval}'`);
	}
	if (
		notNullish(planFeature.reset?.interval_count) &&
		planFeature.reset!.interval_count !== 1
	) {
		parts.push(`interval_count: ${planFeature.reset!.interval_count}`);
	}
	// API: reset_when_enabled (true = reset on enable) -> SDK: carry_over_usage (true = keep existing)
	// They are inverted: reset_when_enabled=false means carry_over_usage=true (default)
	// Only output if explicitly false (meaning carry_over_usage=true, which is non-default behavior)
	if (planFeature.reset?.reset_when_enabled === false) {
		parts.push(`carry_over_usage: true`);
	} else if (planFeature.reset?.reset_when_enabled === true) {
		// reset_when_enabled=true is the default, so carry_over_usage=false
		// Only output if we want to be explicit
		parts.push(`carry_over_usage: false`);
	}

	// Price configuration (NO interval/interval_count - they don't exist in SDK price)
	if (planFeature.price) {
		const priceParts: string[] = [];

		if (notNullish(planFeature.price.amount)) {
			priceParts.push(`amount: ${planFeature.price.amount}`);
		}

		if (planFeature.price.tiers && planFeature.price.tiers.length > 0) {
			const tiersStr = planFeature.price.tiers
				.map(
					(tier) =>
						`{ to: ${tier.to === "inf" ? "'inf'" : tier.to}, amount: ${tier.amount} }`,
				)
				.join(", ");
			priceParts.push(`tiers: [${tiersStr}]`);
		}

		// Note: price.interval and price.interval_count are NOT in SDK - they come from top-level interval

		if (
			notNullish(planFeature.price.billing_units) &&
			planFeature.price.billing_units !== 1
		) {
			priceParts.push(`billing_units: ${planFeature.price.billing_units}`);
		}

		// API: usage_model -> SDK: billing_method
		if (planFeature.price.usage_model) {
			priceParts.push(`billing_method: '${planFeature.price.usage_model}'`);
		}

		if (notNullish(planFeature.price.max_purchase)) {
			priceParts.push(`max_purchase: ${planFeature.price.max_purchase}`);
		}

		if (priceParts.length > 0) {
			parts.push(`price: { ${priceParts.join(", ")} }`);
		}
	}

	// Proration (only if configured)
	if (planFeature.proration) {
		const prorationParts: string[] = [];
		if (planFeature.proration.on_increase) {
			prorationParts.push(
				`on_increase: '${planFeature.proration.on_increase}'`,
			);
		}
		if (planFeature.proration.on_decrease) {
			prorationParts.push(
				`on_decrease: '${planFeature.proration.on_decrease}'`,
			);
		}
		if (prorationParts.length > 0) {
			parts.push(`proration: { ${prorationParts.join(", ")} }`);
		}
	}

	// Rollover (only if configured)
	if (planFeature.rollover) {
		const rolloverParts: string[] = [];
		if (notNullish(planFeature.rollover.max)) {
			rolloverParts.push(`max: ${planFeature.rollover.max}`);
		}
		if (planFeature.rollover.expiry_duration_type) {
			rolloverParts.push(
				`expiry_duration_type: '${planFeature.rollover.expiry_duration_type}'`,
			);
		}
		if (
			notNullish(planFeature.rollover.expiry_duration_length) &&
			planFeature.rollover.expiry_duration_length !== 1
		) {
			rolloverParts.push(
				`expiry_duration_length: ${planFeature.rollover.expiry_duration_length}`,
			);
		}
		if (rolloverParts.length > 0) {
			parts.push(`rollover: { ${rolloverParts.join(", ")} }`);
		}
	}

	return `planFeature({ ${parts.join(", ")} })`;
}
