import { feature, plan, planFeature } from "atmn";

export const meetingCredits = feature({
	id: "meeting_credits",
	name: "Meeting Credits",
	type: "credit_system",
	credit_schema: [
		{
			metered_feature_id: "to_dos",
			credit_cost: 1,
		},
	],
});

export const pro = plan({
	id: "pro",
	name: "Pro",
	auto_enable: true,
	items: [
		planFeature({
			feature_id: meetingCredits.id,
			included: 3,
			reset: { interval: "month" },
		}),
	],
});
