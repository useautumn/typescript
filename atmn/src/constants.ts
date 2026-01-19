// Production URLs (default)
export const FRONTEND_URL = "https://app.useautumn.com";
export const BACKEND_URL = "https://api.useautumn.com";

// Local URLs (used when --local/-l flag is passed)
export const LOCAL_FRONTEND_URL = "http://localhost:3000";
export const LOCAL_BACKEND_URL = "http://localhost:8080";

export const DELETE_CONCURRENCY = 5;

export const DEFAULT_CONFIG = `import {
	feature,
	plan,
	planFeature,
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

export const pro = plan({
	id: 'pro',
	name: 'Pro',
	description: 'Professional plan for growing teams',
	add_on: false,
	auto_enable: false,
	price: {
		amount: 50,
		interval: 'month',
	},
	features: [
		// 500 messages per month
		planFeature({
			feature_id: messages.id,
			granted: 500,
			reset: { interval: 'month' },
		}),

		// $10 per seat per month
		planFeature({
			feature_id: seats.id,
			granted: 1,
			price: {
				amount: 10,
				interval: 'month',
				billing_method: 'pay_per_use',
				billing_units: 1,
			},
		}),
	],
});
`;
