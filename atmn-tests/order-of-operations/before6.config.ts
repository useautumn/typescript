import { feature, plan, planFeature } from "atmn";

export const toDos = feature({
	id: "to_dos",
	name: "To-Dos",
	type: "metered",
	consumable: true,
});

export const meetingCredits = feature({
	id: "meeting_credits",
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
			feature_id: toDos.id,
			included: 10,
			reset: { interval: "month" },
		}),
		planFeature({
			feature_id: meetingCredits.id,
			included: 3,
			reset: { interval: "month" },
		}),
	],
});
