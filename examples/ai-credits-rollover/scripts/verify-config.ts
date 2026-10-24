/**
 * Offline verification for ../autumn.config.ts — no API key needed.
 *
 * Runs the config through the real `atmn` builders and asserts the three
 * properties the scenario relies on:
 *
 *   1. one credit pool: `credits` is a credit system over both models,
 *      at 1 credit (basic) and 10 credits (premium) per request;
 *   2. rollover is configured on both plans' credit items (capped, with
 *      an expiry) next to a monthly reset;
 *   3. both plans share one group, so `attach` swaps plans instead of
 *      stacking them — and Starter is the auto-enabled free plan.
 *
 * This tests the *config*, not Autumn's servers: credit accounting and
 * rollovers themselves happen in Autumn at runtime and can only be
 * observed with a sandbox key (see README, "What is verified").
 *
 * Run: npm run verify:config
 */

import {
	basicModel,
	credits,
	premiumModel,
	pro,
	starter,
} from "../autumn.config.js";

// The builders may emit wire-style (snake_case) or input-style (camelCase)
// keys depending on the atmn version — accept either when reading a field.
function pick(obj: any, ...keys: string[]): any {
	for (const key of keys) {
		if (obj && obj[key] !== undefined) return obj[key];
	}
	return undefined;
}

let failures = 0;
function check(label: string, ok: boolean, detail?: unknown) {
	console.log(
		`  ${ok ? "PASS" : "FAIL"}  ${label}${ok ? "" : ` — got ${JSON.stringify(detail)}`}`,
	);
	if (!ok) failures++;
}

console.log("features");
check(
	"basic_model is a consumable metered feature",
	basicModel.type === "metered" && basicModel.consumable === true,
	basicModel,
);
check(
	"premium_model is a consumable metered feature",
	premiumModel.type === "metered" && premiumModel.consumable === true,
	premiumModel,
);
check(
	"credits is a credit_system feature",
	credits.type === "credit_system",
	credits.type,
);

const schema = pick(credits, "creditSchema", "credit_schema") ?? [];
const costOf = (id: string) =>
	pick(
		schema.find(
			(e: any) =>
				pick(e, "meteredFeatureId", "metered_feature_id") === id,
		),
		"creditCost",
		"credit_cost",
	);
check("basic_model costs 1 credit", costOf("basic_model") === 1, schema);
check("premium_model costs 10 credits", costOf("premium_model") === 10, schema);

console.log("plans");
check(
	"starter and pro share group 'ai_app'",
	starter.group === "ai_app" && pro.group === "ai_app",
	{ starter: starter.group, pro: pro.group },
);
check(
	"starter auto-enables and is free",
	starter.autoEnable === true && starter.price === undefined,
	{ autoEnable: starter.autoEnable, price: starter.price },
);
check(
	"pro costs 20 / month",
	pick(pro.price, "amount") === 20 && pick(pro.price, "interval") === "month",
	pro.price,
);

function creditItem(plan: any): any {
	return (plan.items ?? []).find(
		(it: any) => pick(it, "featureId", "feature_id") === "credits",
	);
}

for (const [name, plan, granted, cap] of [
	["starter", starter, 200, 100],
	["pro", pro, 1000, 500],
] as const) {
	const itemDef = creditItem(plan);
	check(
		`${name} grants ${granted} credits`,
		itemDef && pick(itemDef, "included") === granted,
		itemDef,
	);
	const reset = itemDef && pick(itemDef, "reset");
	check(
		`${name} credits reset monthly`,
		!!reset && pick(reset, "interval") === "month",
		reset,
	);
	const rollover = itemDef && pick(itemDef, "rollover");
	check(
		`${name} rollover cap is ${cap}`,
		!!rollover && pick(rollover, "max") === cap,
		rollover,
	);
	check(
		`${name} rolled-over credits expire after 1 month`,
		!!rollover &&
			pick(rollover, "expiryDurationType", "expiry_duration_type") ===
				"month" &&
			pick(rollover, "expiryDurationLength", "expiry_duration_length") ===
				1,
		rollover,
	);
}

if (failures > 0) {
	console.error(`\n${failures} check(s) failed`);
	process.exit(1);
}
console.log("\nAll config checks passed.");
