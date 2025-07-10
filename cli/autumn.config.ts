import {
	feature,
	product,
	auth,
	featureItem,
	pricedFeatureItem,
	priceItem,
} from 'autumn-js/compose';

// Features
const messages = feature({
	id: 'message',
	name: 'Messages',
	type: 'metered',
});

const taskRuns = feature({
	id: 'task_runs',
	name: 'Task Runs',
	type: 'metered',
});

const canUseTokens = feature({
	id: 'can_use_tokens',
	name: 'Can Use Tokens',
	type: 'boolean',
});

export const freePlan = product({
	id: 'free',
	name: 'Free',
	items: [
		featureItem({
			feature_id: messages.id,
			included_usage: 200,
			interval: 'month',
		}),
	],
});

export const proPlan = product({
	id: 'pro',
	name: 'Pro',
	items: [
		featureItem({
			feature_id: messages.id,
			included_usage: 650,
			interval: 'year',
		}),
		featureItem({
			feature_id: taskRuns.id,
			included_usage: 650,
			interval: 'year',
		}),
		priceItem({
			price: 200,
			interval: 'year',
		}),
		pricedFeatureItem({
			feature_id: messages.id,
			price: 200,
			interval: 'month',
			included_usage: 30,
			billing_units: 100,
			usage_model: 'pay_per_use',
		}),
		pricedFeatureItem({
			feature_id: canUseTokens.id,
			price: 200,
			interval: 'month',
			included_usage: 1,
			billing_units: 1,
			usage_model: 'prepaid',
		}),
	],
});

export const ultraPlan = product({
	id: 'ultra',
	name: 'Ultra',
	items: [
		featureItem({
			feature_id: messages.id,
			included_usage: 900,
			interval: 'year',
		}),
		featureItem({
			feature_id: taskRuns.id,
			included_usage: 900,
			interval: 'year',
		}),
		priceItem({
			price: 300,
			interval: 'year',
		}),
		pricedFeatureItem({
			feature_id: messages.id,
			price: 200,
			interval: 'month',
			included_usage: 80,
			billing_units: 100,
			usage_model: 'pay_per_use',
		}),
	],
});

export default {
	products: [freePlan, proPlan, ultraPlan],
	features: [messages, taskRuns, canUseTokens],
	auth: auth({
		keys: {
			prodKey: 'am_sk_live_vGqdZ9OtrJPewwhOXKKBWvUXwA30GI3Fnsvu3iMint',
			sandboxKey: 'am_sk_test_wuNoYOfyRS8KtNBD0WLTpn3zUZ22lB7tsZrCz1O0hB',
		},
	}),
};
