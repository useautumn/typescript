import { feature, plan, planFeature } from "atmn";

export const meetingCreditsV2 = feature({
	id: "meeting_credits_v2",
	name: "Meeting Credits",
	type: "metered",
	consumable: true,
});

export const pro = plan({
	id: "pro",
	name: "Pro",
	auto_enable: true,
	items: [
		planFeature({
			feature_id: "to_dos",
			included: 10,
			reset: { interval: "month" },
		}),
		planFeature({
			feature_id: meetingCreditsV2.id,
			included: 3,
			reset: { interval: "month" },
		}),
	],
});
