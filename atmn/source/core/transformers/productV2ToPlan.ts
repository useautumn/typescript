import type {Plan, PlanFeature} from '../../compose/models/planModels.js';

/**
 * Transform Product V2 API response to Plan V1 format for CLI
 *
 * API Version History:
 * - Product V1: Entitlements-based (legacy)
 * - Product V2: Items array (current API format with X-API-Version: 2.0.0)
 * - Plan V1: Features array (new CLI format)
 *
 * Transformations:
 * - items[] (Product V2) → features[] + price (Plan V1)
 * - is_add_on → add_on
 * - is_default → default
 * - type: "feature" items → PlanFeature objects
 * - type: "price" items → plan.price
 */
export function transformProductV2ToPlan(productV2: any): Plan {
	// Transform items to features
	const features: PlanFeature[] = (productV2.items || [])
		.filter((item: any) => item.type === 'feature') // Skip price items
		.map((item: any): PlanFeature => {
			const feature: any = {
				feature_id: item.feature_id,
			};

			// Granted/unlimited
			if (item.included_usage !== undefined && item.included_usage !== null) {
				if (item.included_usage === 'inf') {
					feature.unlimited = true;
				} else {
					feature.granted = item.included_usage;
				}
			}

			// Reset configuration
			if (item.interval && !item.price) {
				// This is a reset interval (not a price interval)
				feature.reset = {
					interval: item.interval,
				};
				if (item.interval_count) {
					feature.reset.interval_count = item.interval_count;
				}
				if (item.reset_usage_when_enabled !== undefined) {
					feature.reset.when_enabled = item.reset_usage_when_enabled;
				}
			}

			// Price configuration
			if (item.price || item.tiers) {
				feature.price = {};

				if (item.price) {
					feature.price.amount = item.price;
				}

				if (item.tiers) {
					feature.price.tiers = item.tiers;
				}

				if (item.interval && item.price) {
					// This is a price interval
					feature.price.interval = item.interval;
				}

				if (item.interval_count && item.price) {
					feature.price.interval_count = item.interval_count;
				}

				if (item.billing_units) {
					feature.price.billing_units = item.billing_units;
				}

				if (item.usage_model) {
					feature.price.usage_model = item.usage_model;
				}

				if (item.usage_limit) {
					feature.price.max_purchase = item.usage_limit;
				}
			}

			// Config mapping
			if (item.config) {
				if (item.config.on_increase || item.config.on_decrease) {
					feature.proration = {};
					if (item.config.on_increase) feature.proration.on_increase = item.config.on_increase;
					if (item.config.on_decrease) feature.proration.on_decrease = item.config.on_decrease;
				}

				if (item.config.rollover) {
					feature.rollover = {
						max: item.config.rollover.max,
						expiry_duration_type: item.config.rollover.duration,
					};
					if (item.config.rollover.length) {
						feature.rollover.expiry_duration_length = item.config.rollover.length;
					}
				}
			}

			return feature as PlanFeature;
		});

	// Extract base price from price items
	let basePrice: Plan['price'] | undefined = undefined;
	const priceItem = (productV2.items || []).find((item: any) => item.type === 'price');
	if (priceItem && priceItem.price) {
		basePrice = {
			amount: priceItem.price,
			interval: priceItem.interval || 'month',
		};
	}

	// Build Plan
	const plan: Plan = {
		id: productV2.id,
		name: productV2.name,
		description: productV2.description || null,
		group: productV2.group || '',
		add_on: productV2.is_add_on || false,
		default: productV2.is_default || false,
		price: basePrice,
		features,
		free_trial: productV2.free_trial || null,
	};

	return plan;
}
