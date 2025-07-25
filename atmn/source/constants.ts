// export const FRONTEND_URL = 'http://localhost:3000';
// export const BACKEND_URL = 'http://localhost:8080';
export const FRONTEND_URL = 'http://app.useautumn.com';
export const BACKEND_URL = 'https://api.useautumn.com';

export const DEFAULT_CONFIG = `import {
	feature,
	product,
	priceItem,
	featureItem,
	pricedFeatureItem,
} from 'atmn';

export const seats = feature({
	id: 'seats',
	name: 'Seats',
	type: 'continuous_use',
});

export const messages = feature({
	id: 'messages',
	name: 'Messages',
	type: 'single_use',
});

export const pro = product({
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
`;
