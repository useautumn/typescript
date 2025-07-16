export const FRONTEND_URL = 'http://localhost:3000';
export const BACKEND_URL = 'http://localhost:8080';

export const DEFAULT_CONFIG = `import {
	feature,
	product,
	priceItem,
	featureItem,
	pricedFeatureItem,
} from 'autumn-js/compose';

const seats = feature({
	id: 'seats',
	name: 'Seats',
	type: 'continuous_use',
});

const messages = feature({
	id: 'messages',
	name: 'Messages',
	type: 'single_use',
});

const pro = product({
	id: 'pro',
	name: 'Pro',
	items: [
		// 500 messages per month
		featureItem({
			feature_id: messages.id,
			included_usage: 500,
			interval: 'month',
		}),

		// $10 per seat per month
		pricedFeatureItem({
			feature_id: seats.id,
			price: 10,
			interval: 'month',
		}),

		// $50 / month
		priceItem({
			price: 50,
			interval: 'month',
		}),
	],
});

export default {
	features: [seats, messages],
	products: [pro],
};
`;