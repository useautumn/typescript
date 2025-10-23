import {Plan, PlanFeature, Feature} from '../../compose/index.js';
import {idToVar, notNullish, nullish} from '../utils.js';

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
    plans: [${planIds.map(id => `${idToVar({id, prefix: 'plan'})}`).join(', ')}],
    features: [${featureIds.map(id => `${idToVar({id, prefix: 'feature'})}`).join(', ')}]
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
	const planFeaturesStr = plan.features
		?.map((pf: PlanFeature) => planFeatureBuilder({planFeature: pf, features}))
		.join(',\n        ') || '';

	const priceStr = plan.price
		? `\n    price: {\n        amount: ${plan.price.amount},\n        interval: '${plan.price.interval}',\n    },`
		: '';

	const descriptionStr = plan.description && plan.description !== null
		? `\n    description: '${plan.description.replace(/'/g, "\\'")}',`
		: '';

	const groupStr = plan.group && plan.group !== '' && plan.group !== null
		? `\n    group: '${plan.group}',`
		: '';

	const addOnStr = plan.add_on === true
		? `\n    add_on: true,`
		: '';

	const defaultStr = plan.default === true
		? `\n    default: true,`
		: '';

	const freeTrialStr = plan.free_trial && plan.free_trial !== null
		? `\n    free_trial: {\n        duration_type: '${plan.free_trial.duration_type}',\n        duration_length: ${plan.free_trial.duration_length},\n        card_required: ${plan.free_trial.card_required},\n    },`
		: '';

	const snippet = `
export const ${idToVar({id: plan.id, prefix: 'plan'})} = plan({
    id: '${plan.id}',
    name: '${plan.name}',${descriptionStr}${groupStr}${addOnStr}${defaultStr}${priceStr}
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
	if (nullish(featureId)) return '';

	let feature = features.find(f => f.id === featureId);

	if (feature?.archived) return `"${featureId}"`;
	return `${idToVar({id: featureId, prefix: 'feature'})}.id`;
};

// Plan Feature Builder

function planFeatureBuilder({
	planFeature,
	features,
}: {
	planFeature: PlanFeature;
	features: Feature[];
}) {
	const featureIdStr = getFeatureIdStr({
		featureId: planFeature.feature_id,
		features,
	});

	let parts: string[] = [`feature_id: ${featureIdStr}`];

	// Granted usage (only if has a value)
	if (notNullish(planFeature.granted) && planFeature.granted > 0) {
		parts.push(`granted: ${planFeature.granted}`);
	}

	// Unlimited (only if true)
	if (planFeature.unlimited === true) {
		parts.push(`unlimited: true`);
	}

	// Reset configuration (only if has meaningful fields)
	if (planFeature.reset) {
		const resetParts: string[] = [];
		if (planFeature.reset.interval) {
			resetParts.push(`interval: '${planFeature.reset.interval}'`);
		}
		if (notNullish(planFeature.reset.interval_count) && planFeature.reset.interval_count !== 1) {
			resetParts.push(`interval_count: ${planFeature.reset.interval_count}`);
		}
		if (planFeature.reset.when_enabled === true) {
			resetParts.push(`when_enabled: true`);
		}
		if (planFeature.reset.when_enabled === false) {
			resetParts.push(`when_enabled: false`);
		}
		if (resetParts.length > 0) {
			parts.push(`reset: { ${resetParts.join(', ')} }`);
		}
	}

	// Price configuration (only if has meaningful fields)
	if (planFeature.price) {
		const priceParts: string[] = [];

		if (notNullish(planFeature.price.amount)) {
			priceParts.push(`amount: ${planFeature.price.amount}`);
		}

		if (planFeature.price.tiers && planFeature.price.tiers.length > 0) {
			const tiersStr = planFeature.price.tiers
				.map(tier => `{ to: ${tier.to === 'inf' ? "'inf'" : tier.to}, amount: ${tier.amount} }`)
				.join(', ');
			priceParts.push(`tiers: [${tiersStr}]`);
		}

		if (planFeature.price.interval) {
			priceParts.push(`interval: '${planFeature.price.interval}'`);
		}

		if (notNullish(planFeature.price.interval_count) && planFeature.price.interval_count !== 1) {
			priceParts.push(`interval_count: ${planFeature.price.interval_count}`);
		}

		if (notNullish(planFeature.price.billing_units) && planFeature.price.billing_units !== 1) {
			priceParts.push(`billing_units: ${planFeature.price.billing_units}`);
		}

		if (planFeature.price.usage_model) {
			priceParts.push(`usage_model: '${planFeature.price.usage_model}'`);
		}

		if (notNullish(planFeature.price.max_purchase)) {
			priceParts.push(`max_purchase: ${planFeature.price.max_purchase}`);
		}

		if (priceParts.length > 0) {
			parts.push(`price: { ${priceParts.join(', ')} }`);
		}
	}

	// Proration (only if configured)
	if (planFeature.proration) {
		const prorationParts: string[] = [];
		if (planFeature.proration.on_increase) {
			prorationParts.push(`on_increase: '${planFeature.proration.on_increase}'`);
		}
		if (planFeature.proration.on_decrease) {
			prorationParts.push(`on_decrease: '${planFeature.proration.on_decrease}'`);
		}
		if (prorationParts.length > 0) {
			parts.push(`proration: { ${prorationParts.join(', ')} }`);
		}
	}

	// Rollover (only if configured)
	if (planFeature.rollover) {
		const rolloverParts: string[] = [];
		if (notNullish(planFeature.rollover.max)) {
			rolloverParts.push(`max: ${planFeature.rollover.max}`);
		}
		if (planFeature.rollover.expiry_duration_type) {
			rolloverParts.push(`expiry_duration_type: '${planFeature.rollover.expiry_duration_type}'`);
		}
		if (notNullish(planFeature.rollover.expiry_duration_length) && planFeature.rollover.expiry_duration_length !== 1) {
			rolloverParts.push(`expiry_duration_length: ${planFeature.rollover.expiry_duration_length}`);
		}
		if (rolloverParts.length > 0) {
			parts.push(`rollover: { ${rolloverParts.join(', ')} }`);
		}
	}

	return `planFeature({ ${parts.join(', ')} })`;
}
