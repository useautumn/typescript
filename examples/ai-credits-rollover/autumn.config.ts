import { feature, item, plan } from "atmn";

// Pricing for a small AI app, declared as code.
//
// The app sells one shared pool of "AI Credits". Two metered models draw
// from that pool at different rates: a basic model costs 1 credit per
// request, a premium model costs 10. The two cases that usually break when
// you hand-build them on raw Stripe — credit rollovers and a mid-cycle
// plan change — are config here, not app code.
//
// Push this config to a sandbox with:  npx atmn push
// (Config API: the published `atmn` 1.1.x package — the line this repo's
// `nextjs/` example app resolves via `atmn: ^1.1.1`. Pinned exactly in
// package.json so the example runs against the version it was verified
// with; see README, "Versions".)

// ── Features ────────────────────────────────────────────────────────────────

export const basicModel = feature({
	id: "basic_model",
	name: "Basic Model",
	type: "metered",
	consumable: true,
});

export const premiumModel = feature({
	id: "premium_model",
	name: "Premium Model",
	type: "metered",
	consumable: true,
});

// One balance pool that both models draw from, at different credit costs.
// In your app code you always check / track the *underlying* features
// (basic_model, premium_model) — Autumn converts the usage to credits.
export const credits = feature({
	id: "credits",
	name: "AI Credits",
	type: "credit_system",
	creditSchema: [
		{ meteredFeatureId: basicModel.id, creditCost: 1 },
		{ meteredFeatureId: premiumModel.id, creditCost: 10 },
	],
});

// ── Plans ───────────────────────────────────────────────────────────────────
// Both plans are in the same `group`, so attaching one replaces the other:
// that is what makes attach() an upgrade / downgrade instead of a second,
// parallel subscription.

export const starter = plan({
	id: "starter",
	name: "Starter",
	group: "ai_app",
	// New customers land on Starter automatically.
	autoEnable: true,
	items: [
		item({
			featureId: credits.id,
			included: 200,
			reset: { interval: "month" },
			// Up to 100 unused credits roll into the next month instead of
			// expiring; rolled-over credits themselves expire after 1 month.
			rollover: {
				max: 100,
				expiryDurationType: "month",
				expiryDurationLength: 1,
			},
		}),
	],
});

export const pro = plan({
	id: "pro",
	name: "Pro",
	group: "ai_app",
	price: { amount: 20, interval: "month" },
	items: [
		item({
			featureId: credits.id,
			included: 1000,
			reset: { interval: "month" },
			// Same rollover idea, bigger cap.
			rollover: {
				max: 500,
				expiryDurationType: "month",
				expiryDurationLength: 1,
			},
		}),
	],
});
