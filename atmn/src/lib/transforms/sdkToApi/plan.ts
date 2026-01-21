import type { Plan, PlanFeature } from "../../../../source/compose/models/index.js";

/**
 * API plan format expected by the server's CreatePlanParams schema
 */
export interface ApiPlanParams {
	id: string;
	name: string;
	description?: string | null;
	group?: string;
	add_on?: boolean;
	default?: boolean;
	price?: {
		amount: number;
		interval: string;
	};
	features?: ApiPlanFeatureParams[];
	free_trial?: {
		duration_type: string;
		duration_length: number;
		card_required: boolean;
	} | null;
}

export interface ApiPlanFeatureParams {
	feature_id: string;
	granted_balance?: number;  // API uses granted_balance, SDK uses included
	unlimited?: boolean;
	reset?: {
		interval: string;
		interval_count?: number;
	};
	price?: {
		amount?: number;
		tiers?: Array<{ to: number | "inf"; amount: number }>;
		interval: string;
		interval_count?: number;
		billing_units?: number;
		usage_model: string;
		max_purchase?: number;
	};
	proration?: {
		on_increase: string;
		on_decrease: string;
	};
	rollover?: {
		max: number;
		expiry_duration_type: string;
		expiry_duration_length?: number;
	};
}

/**
 * Transform SDK PlanFeature to API format
 */
function transformPlanFeature(feature: PlanFeature): ApiPlanFeatureParams {
	const result: ApiPlanFeatureParams = {
		feature_id: feature.feature_id,
	};

	// SDK uses 'included', API uses 'granted_balance'
	if (feature.included !== undefined) {
		result.granted_balance = feature.included;
	}

	if (feature.unlimited !== undefined) {
		result.unlimited = feature.unlimited;
	}

	if (feature.reset) {
		result.reset = {
			interval: feature.reset.interval,
			...(feature.reset.interval_count !== undefined && {
				interval_count: feature.reset.interval_count,
			}),
		};
	}

	if (feature.price) {
		// Get interval from price if available, otherwise from reset, or default to "month"
		// Note: SDK price may have interval from the spread in apiToSdk transform
		const price = feature.price as Record<string, unknown>;
		const interval = (price.interval as string) ?? feature.reset?.interval ?? "month";
		
		result.price = {
			interval,
			billing_units: feature.price.billing_units ?? 1,
			// SDK uses billing_method, API uses usage_model
			usage_model: feature.price.billing_method ?? "prepaid",
			...(feature.price.amount !== undefined && { amount: feature.price.amount }),
			...(feature.price.tiers && { tiers: feature.price.tiers }),
			...(price.interval_count !== undefined && {
				interval_count: price.interval_count as number,
			}),
			...(feature.price.max_purchase !== undefined && {
				max_purchase: feature.price.max_purchase,
			}),
		};
	}

	if (feature.proration) {
		result.proration = {
			on_increase: feature.proration.on_increase,
			on_decrease: feature.proration.on_decrease,
		};
	}

	if (feature.rollover) {
		result.rollover = {
			// API expects number, SDK allows null (treat null as 0 or very large number)
			max: feature.rollover.max ?? 0,
			expiry_duration_type: feature.rollover.expiry_duration_type,
			...(feature.rollover.expiry_duration_length !== undefined && {
				expiry_duration_length: feature.rollover.expiry_duration_length,
			}),
		};
	}

	return result;
}

/**
 * Transform SDK Plan to API format for has_customers endpoint
 */
export function transformPlanToApi(plan: Plan): ApiPlanParams {
	const result: ApiPlanParams = {
		id: plan.id,
		name: plan.name,
	};

	if (plan.description !== undefined) {
		result.description = plan.description;
	}

	if (plan.group !== undefined) {
		result.group = plan.group;
	}

	if (plan.add_on !== undefined) {
		result.add_on = plan.add_on;
	}

	// SDK uses 'auto_enable', API uses 'default'
	if (plan.auto_enable !== undefined) {
		result.default = plan.auto_enable;
	}

	if (plan.price) {
		result.price = {
			amount: plan.price.amount,
			interval: plan.price.interval,
		};
	}

	if (plan.features && plan.features.length > 0) {
		result.features = plan.features.map(transformPlanFeature);
	}

	if (plan.free_trial !== undefined) {
		result.free_trial = plan.free_trial
			? {
					duration_type: plan.free_trial.duration_type,
					duration_length: plan.free_trial.duration_length,
					card_required: plan.free_trial.card_required,
				}
			: null;
	}

	return result;
}
