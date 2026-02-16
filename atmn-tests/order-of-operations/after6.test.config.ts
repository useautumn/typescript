import { feature, plan, planFeature } from 'atmn';

// Features
export const meeting_credits_v2 = feature({
	id: 'meeting_credits_v2',
	name: 'Meeting Credits',
	type: 'metered',
	consumable: true,
});

export const to_dos = feature({
	id: 'to_dos',
	name: 'To-Dos',
	type: 'metered',
	consumable: true,
	archived: false,
});

// Plans
export const pro = plan({
	id: 'pro',
	name: 'Pro',
	auto_enable: true,
	items: [
		planFeature({
			feature_id: meeting_credits_v2.id,
			included: 3,
			unlimited: false,
			reset: {
				interval: 'month',
			},
		}),
		planFeature({
			feature_id: to_dos.id,
			included: 10,
			unlimited: false,
			reset: {
				interval: 'month',
			},
		}),
	],
});
