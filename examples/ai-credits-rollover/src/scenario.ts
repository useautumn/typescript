/**
 * Worked example: AI credits with rollovers and a mid-cycle plan change.
 *
 * Runs the pricing declared in ../autumn.config.ts through the Autumn API
 * and narrates each step:
 *
 *   1. A customer lands on Starter (200 credits / month).
 *   2. They spend credits — basic requests cost 1 credit, premium requests
 *      cost 10, all from one shared pool.
 *   3. Rollover: what happens to unused credits when the month resets, and
 *      where to see it (the balance's `rollovers` breakdown).
 *   4. Mid-cycle, they upgrade Starter → Pro. Autumn charges for the plan
 *      change, and their remaining credits are carried over instead of
 *      being replaced by the new plan's grant.
 *
 * Before running:
 *   1. `npx atmn push`            — push ../autumn.config.ts to your sandbox
 *   2. `cp .env.example .env`     — add your sandbox secret key
 *   3. `npm run scenario`
 *
 * No real money moves: use a sandbox (test-mode) key throughout. The
 * script refuses to run against a non-test key unless you explicitly
 * opt in with AUTUMN_ALLOW_LIVE_KEY=1. If the demo customer has no
 * payment method, the Pro upgrade in step 4 returns a payment URL
 * instead of completing — open it, pay with a Stripe test card, then
 * run this script again.
 *
 * The script is safe to re-run. `track` has no idempotency key — a second
 * identical call deducts twice — so each completed `track` step is
 * recorded in a local state file (.demo-state.json, gitignored) and
 * skipped on later runs; the plan steps are guarded by the customer's
 * live state instead. The state file is tied to the API key in use (it
 * stores a hash of the key, never the key itself): run with a different
 * sandbox's key and the recorded spend is ignored rather than applied to
 * the wrong account. A state file that cannot be read or parsed stops
 * the script with an error — guessing from corrupt state could record
 * the spend twice. Those guards are application-level logic on purpose:
 * duplicate protection is your code's job, not the billing provider's.
 */

import { createHash } from "node:crypto";
import { existsSync, readFileSync, renameSync, writeFileSync } from "node:fs";

import { Autumn } from "autumn-js";

import { credits as creditsFeature, pro, starter } from "../autumn.config.js";

// Load .env from the example root if one exists. Done in code rather
// than with Node's --env-file flags because those need Node 22.9+
// (--env-file-if-exists), while this example otherwise runs on the Node
// versions its dependencies support (atmn declares >= 16, and this
// package pins @types/node 20). A value already present in the
// environment always wins; .env only fills in what is missing.
const ENV_URL = new URL("../.env", import.meta.url);
try {
	if (existsSync(ENV_URL)) {
		for (const line of readFileSync(ENV_URL, "utf8").split("\n")) {
			const trimmed = line.trim();
			if (!trimmed || trimmed.startsWith("#")) continue;
			const eq = trimmed.indexOf("=");
			if (eq === -1) continue;
			const name = trimmed.slice(0, eq).trim();
			let value = trimmed.slice(eq + 1).trim();
			if (
				value.length >= 2 &&
				((value.startsWith('"') && value.endsWith('"')) ||
					(value.startsWith("'") && value.endsWith("'")))
			) {
				value = value.slice(1, -1);
			}
			if (name && process.env[name] === undefined) {
				process.env[name] = value;
			}
		}
	}
} catch {
	// An unreadable .env is not fatal: the key may be set inline, and if
	// it is not, the missing-key guidance below explains what to do.
}

const secretKey = process.env.AUTUMN_SECRET_KEY;

if (!secretKey) {
	console.error(
		[
			"Missing AUTUMN_SECRET_KEY.",
			"",
			"Create a sandbox in the Autumn dashboard, copy its secret key",
			"(am_sk_test_...), then run:",
			"",
			"  AUTUMN_SECRET_KEY=am_sk_test_... npm run scenario",
			"",
			"Also make sure you pushed the pricing config first:  npx atmn push",
		].join("\n"),
	);
	process.exit(1);
}

// Autumn keys encode their environment in the key itself: am_sk_test_...
// is a sandbox key, am_sk_live_... is production — the same split atmn's
// own isSandboxKey() makes. Step 4 charges for a plan upgrade, so a
// non-test key is refused by default; running against a live organisation
// takes an explicit opt-in.
const keyEnvironment = secretKey.split("am_sk_")[1]?.split("_")[0];
if (keyEnvironment !== "test") {
	if (process.env.AUTUMN_ALLOW_LIVE_KEY !== "1") {
		console.error(
			[
				"AUTUMN_SECRET_KEY is not a sandbox (test-mode) key.",
				"",
				"This example attaches a paid plan and records usage, so it",
				"refuses to run against a live organisation. Use a sandbox",
				"key (am_sk_test_...), or — only if you really mean it —",
				"opt in explicitly:",
				"",
				"  AUTUMN_ALLOW_LIVE_KEY=1 npm run scenario",
			].join("\n"),
		);
		process.exit(1);
	}
	console.warn(
		"WARNING: running with a non-sandbox key because " +
			"AUTUMN_ALLOW_LIVE_KEY=1 is set. Real charges will occur.",
	);
}

const autumn = new Autumn({ secretKey });

const CUSTOMER_ID = "demo_user_credits_example";
const STARTER = "starter";
const PRO = "pro";
const CREDITS = "credits";
const BASIC_MODEL = "basic_model";
const PREMIUM_MODEL = "premium_model";

// The demo spend in step 2: 40 basic (40 credits) + 6 premium (60 credits).
const SPEND_BASIC = 40;
const SPEND_PREMIUM = 6;

// Billing terms are read from autumn.config.ts, never restated here, so
// this script cannot silently drift from the config it narrates. (The
// atmn builders may emit camelCase or snake_case keys — accept either,
// as scripts/verify-config.ts does.)
function pickField(obj: any, ...keys: string[]): any {
	for (const key of keys) {
		if (obj && obj[key] !== undefined) return obj[key];
	}
	return undefined;
}

function creditCostOf(featureId: string): number {
	const schema =
		pickField(creditsFeature, "creditSchema", "credit_schema") ?? [];
	const entry = schema.find(
		(e: any) =>
			pickField(e, "meteredFeatureId", "metered_feature_id") ===
			featureId,
	);
	return pickField(entry, "creditCost", "credit_cost") ?? 0;
}

const BASIC_CREDIT_COST = creditCostOf(BASIC_MODEL);
const PREMIUM_CREDIT_COST = creditCostOf(PREMIUM_MODEL);

// The spend maths below divides by the credit costs, so a config that
// left a model unpriced (or priced it at zero) would corrupt it. Refuse
// up front — before any API call — rather than narrate wrong numbers.
if (BASIC_CREDIT_COST <= 0 || PREMIUM_CREDIT_COST <= 0) {
	console.error(
		[
			"autumn.config.ts does not price both models in credits.",
			"",
			"The `credits` feature's creditSchema must give basic_model and",
			"premium_model a credit cost above zero. Check the config with:",
			"",
			"  npm run verify:config",
		].join("\n"),
	);
	process.exit(1);
}

function rolloverOf(plan: any) {
	const itemDef = (plan?.items ?? []).find(
		(it: any) => pickField(it, "featureId", "feature_id") === CREDITS,
	);
	return itemDef ? pickField(itemDef, "rollover") : undefined;
}

const PLANS: Record<string, any> = { [STARTER]: starter, [PRO]: pro };
const ROLLOVER_CAP: Record<string, number> = {
	[STARTER]: rolloverOf(starter)?.max ?? 0,
	[PRO]: rolloverOf(pro)?.max ?? 0,
};

// ── Local completion state ────────────────────────────────────────────────
// Balance `usage` is scoped to the current billing cycle, so it cannot
// say whether the demo spend already happened in an earlier cycle. Each
// completed `track` step is therefore recorded in a small state file
// (gitignored) and consulted before tracking again.
//
// The state is loaded and validated before any API call, and it fails
// closed: only a *missing* file means "first run". A file that cannot be
// read or parsed stops the script, because silently starting over from
// corrupt state could record the spend — and deduct the credits — twice.
//
// The state is also tied to the API key it was written under, via a
// SHA-256 fingerprint of the key (never the key itself). The same
// customer ID in a different sandbox is a different customer, and
// recorded steps from another account must not suppress this account's
// spend.
const STATE_URL = new URL("../.demo-state.json", import.meta.url);
const STATE_TMP_URL = new URL("../.demo-state.json.tmp", import.meta.url);
const KEY_FINGERPRINT = createHash("sha256")
	.update(secretKey)
	.digest("hex")
	.slice(0, 16);

type DemoState = {
	keyFingerprint?: string;
	customers: Record<string, Record<string, number>>;
};

function stateError(problem: string): never {
	console.error(
		[
			problem,
			"",
			".demo-state.json is this example's duplicate protection, so the",
			"script stops instead of guessing: guessing wrong could record",
			"the demo spend — and deduct the credits — a second time.",
			"",
			"To start over safely, delete .demo-state.json AND use a fresh",
			"customer (or nuke the sandbox with `npx atmn nuke`). Deleting",
			"it on its own, against a customer who already spent, will",
			"re-track the spend.",
		].join("\n"),
	);
	process.exit(1);
}

function loadState(): DemoState {
	let raw: string;
	try {
		raw = readFileSync(STATE_URL, "utf8");
	} catch (err) {
		if ((err as NodeJS.ErrnoException)?.code === "ENOENT") {
			return { customers: {} };
		}
		return stateError(
			`Could not read .demo-state.json (${(err as Error).message}).`,
		);
	}
	let parsed: unknown;
	try {
		parsed = JSON.parse(raw);
	} catch {
		return stateError(".demo-state.json is not valid JSON.");
	}
	if (
		!parsed ||
		typeof parsed !== "object" ||
		typeof (parsed as DemoState).customers !== "object" ||
		(parsed as DemoState).customers === null ||
		Object.values((parsed as DemoState).customers).some(
			(record) =>
				!record ||
				typeof record !== "object" ||
				Object.values(record).some((v) => typeof v !== "number"),
		)
	) {
		return stateError(".demo-state.json does not have the expected shape.");
	}
	return parsed as DemoState;
}

function saveState(state: DemoState) {
	state.keyFingerprint = KEY_FINGERPRINT;
	// Write to a temp file and rename, so a crash mid-write cannot leave
	// a truncated state file behind for the next run to trip over.
	writeFileSync(STATE_TMP_URL, `${JSON.stringify(state, null, 2)}\n`);
	renameSync(STATE_TMP_URL, STATE_URL);
}

const state = loadState();
if (state.keyFingerprint !== KEY_FINGERPRINT) {
	if (Object.keys(state.customers).length > 0) {
		console.log(
			"Note: .demo-state.json was written under a different Autumn" +
				" key (a different sandbox or organisation), so its recorded" +
				" spend does not apply here — starting the spend tracking" +
				" fresh. Usage this customer already has under this key is" +
				" still adopted from the live balance in step 2.",
		);
	}
	state.customers = {};
	state.keyFingerprint = KEY_FINGERPRINT;
}

function heading(step: string, title: string) {
	console.log(`\n── Step ${step}: ${title}`);
}

type Customer = Awaited<ReturnType<typeof autumn.customers.get>>;

/** Plan IDs with a live (not canceled) subscription, e.g. ["starter"]. */
function currentPlanIds(customer: Customer): string[] {
	return (customer.subscriptions ?? [])
		.filter((sub) => sub.canceledAt === null)
		.map((sub) => sub.planId);
}

/** Print the credit balance in a stable, readable shape. */
function printCreditBalance(context: string, customer: Customer) {
	const balance = customer.balances?.[CREDITS];

	if (!balance) {
		console.log(`  [${context}] no credit balance found`);
		return;
	}

	console.log(`  [${context}] credits balance:`);
	console.log(`    granted:   ${balance.granted}`);
	console.log(`    used:      ${balance.usage}`);
	console.log(`    remaining: ${balance.remaining}`);
	console.log(
		`    resets at: ${
			balance.nextResetAt
				? new Date(balance.nextResetAt).toISOString()
				: "never (one-off)"
		}`,
	);
	if (balance.rollovers && balance.rollovers.length > 0) {
		console.log(
			`    rolled over from previous cycles: ${JSON.stringify(balance.rollovers)}`,
		);
	}
	if (balance.breakdown && balance.breakdown.length > 0) {
		console.log(`    breakdown: ${JSON.stringify(balance.breakdown)}`);
	}
}

async function main() {
	// ── Step 1 ──────────────────────────────────────────────────────────────
	heading("1", "Customer starts on Starter (auto-enabled free plan)");
	let customer = await autumn.customers.getOrCreate({
		customerId: CUSTOMER_ID,
		name: "Demo User",
		email: "demo@example.com",
	});
	// Starter has `autoEnable: true` in the config, so a brand-new customer
	// already has it and there is nothing to attach. The explicit attach
	// below only runs for a customer who exists but has no plan yet — and
	// shows the call you would use for any plan that is not auto-enabled.
	if (currentPlanIds(customer).length === 0) {
		await autumn.billing.attach({
			customerId: CUSTOMER_ID,
			planId: STARTER,
		});
		customer = await autumn.customers.get({ customerId: CUSTOMER_ID });
	} else {
		console.log(
			`  already on plan(s): ${currentPlanIds(customer).join(", ")} — skipping attach`,
		);
	}
	printCreditBalance("after Starter attach", customer);

	// ── Step 2 ──────────────────────────────────────────────────────────────
	heading(
		"2",
		`Spend credits: ${SPEND_BASIC} basic requests + ${SPEND_PREMIUM} premium requests`,
	);
	const steps = (state.customers[CUSTOMER_ID] ??= {});
	const basicStep = `track:${BASIC_MODEL}`;
	const premiumStep = `track:${PREMIUM_MODEL}`;

	// Reconcile the recorded steps with the usage the current cycle
	// already shows, so usage that reached Autumn without being recorded
	// locally is not tracked twice. That gap is small but real: a run
	// can stop after a `track` call lands and before the state file is
	// written, or the state file can pre-date a step. The spend always
	// lands basic-first — this script tracks basic before premium in
	// every run — so cycle usage attributes unambiguously: basic
	// requests up to the full basic spend, then premium requests from
	// what is left over, and only in whole premium requests.
	const cycleUsage = customer.balances?.[CREDITS]?.usage ?? 0;
	if (cycleUsage > 0) {
		const basicFromUsage = Math.min(
			SPEND_BASIC,
			Math.floor(
				Math.min(cycleUsage, SPEND_BASIC * BASIC_CREDIT_COST) /
					BASIC_CREDIT_COST,
			),
		);
		const usageAfterBasic = cycleUsage - SPEND_BASIC * BASIC_CREDIT_COST;
		const premiumFromUsage =
			usageAfterBasic > 0 && usageAfterBasic % PREMIUM_CREDIT_COST === 0
				? Math.min(SPEND_PREMIUM, usageAfterBasic / PREMIUM_CREDIT_COST)
				: 0;
		let adopted = false;
		if (basicFromUsage > (steps[basicStep] ?? 0)) {
			steps[basicStep] = basicFromUsage;
			adopted = true;
		}
		if (premiumFromUsage > (steps[premiumStep] ?? 0)) {
			steps[premiumStep] = premiumFromUsage;
			adopted = true;
		}
		if (adopted) {
			saveState(state);
			console.log(
				`  adopted ${cycleUsage} credits of existing usage into .demo-state.json — it will not be tracked again`,
			);
		}
	}

	const basicRemaining = SPEND_BASIC - (steps[basicStep] ?? 0);
	const premiumRemaining = SPEND_PREMIUM - (steps[premiumStep] ?? 0);

	if (basicRemaining <= 0 && premiumRemaining <= 0) {
		console.log(
			"  demo spend already tracked in an earlier run (recorded in .demo-state.json) — skipping",
		);
	} else {
		// Gate first, then track. The gate checks the *pool*: `check` on
		// the credit system itself, with requiredBalance set to the
		// total credits the remaining spend costs. Checking one metered
		// feature instead would price only that feature's portion —
		// requiredBalance is converted at that feature's credit cost —
		// so a pass could still leave the other portion unaffordable.
		// If the gate denies the spend, nothing is tracked, nothing is
		// recorded, and the run stops before the paid upgrade: fix the
		// cause and re-run.
		const totalRemainingCredits =
			basicRemaining * BASIC_CREDIT_COST +
			premiumRemaining * PREMIUM_CREDIT_COST;
		const gate = await autumn.check({
			customerId: CUSTOMER_ID,
			featureId: CREDITS,
			requiredBalance: totalRemainingCredits, // can this customer afford the whole remaining spend?
		});
		console.log(
			`  check credits x${totalRemainingCredits} (${basicRemaining} basic + ${premiumRemaining} premium requests remaining) → allowed: ${gate.allowed}`,
		);

		if (!gate.allowed) {
			console.log(
				[
					"  check denied the spend — no usage was tracked and the",
					"  upgrade was not attempted. Fix the cause (usually: top",
					"  up the balance, or start from a fresh customer) and",
					"  re-run; the recorded state makes the re-run resume",
					"  from this step.",
				].join("\n"),
			);
			// The scenario did not finish — steps 3 and 4 never ran —
			// so the exit code must say so. Returning normally here
			// would report success for a run that stopped halfway.
			process.exitCode = 1;
			return;
		}

		// `async: false` applies the usage before responding, so the
		// balances printed below are already up to date. Each step is
		// recorded as soon as it lands, so a run that stops halfway
		// resumes with only the remainder.
		const tracked: string[] = [];
		if (basicRemaining > 0) {
			await autumn.track({
				customerId: CUSTOMER_ID,
				featureId: BASIC_MODEL,
				value: basicRemaining,
				async: false,
			});
			steps[basicStep] = SPEND_BASIC;
			saveState(state);
			tracked.push(
				`${basicRemaining} basic (${basicRemaining * BASIC_CREDIT_COST} credits)`,
			);
		}
		if (premiumRemaining > 0) {
			await autumn.track({
				customerId: CUSTOMER_ID,
				featureId: PREMIUM_MODEL,
				value: premiumRemaining,
				async: false,
			});
			steps[premiumStep] = SPEND_PREMIUM;
			saveState(state);
			tracked.push(
				`${premiumRemaining} premium (${premiumRemaining * PREMIUM_CREDIT_COST} credits)`,
			);
		}
		console.log(`  tracked ${tracked.join(" + ")}`);
	}
	customer = await autumn.customers.get({ customerId: CUSTOMER_ID });
	printCreditBalance("after usage", customer);

	// ── Step 3 ──────────────────────────────────────────────────────────────
	heading("3", "Rollover at the monthly reset");
	const balanceNow = customer.balances?.[CREDITS];
	// The rollover terms that apply at the reset are those of the plan
	// the customer ends the cycle on; if two plans somehow both read as
	// current, that is the paid one.
	const planIdsNow = currentPlanIds(customer);
	const planNow = planIdsNow.includes(PRO) ? PRO : (planIdsNow[0] ?? STARTER);
	const cap = ROLLOVER_CAP[planNow] ?? 0;
	const rolloverNow = rolloverOf(PLANS[planNow]);
	const expiryLength = rolloverNow
		? pickField(rolloverNow, "expiryDurationLength", "expiry_duration_length")
		: undefined;
	const expiryType = rolloverNow
		? pickField(rolloverNow, "expiryDurationType", "expiry_duration_type")
		: undefined;
	if (balanceNow) {
		console.log(
			[
				"  Nothing to call here: rollover is configured on the plan item",
				`  (see autumn.config.ts — ${STARTER} rolls over up to ${ROLLOVER_CAP[STARTER]} unused`,
				`  credits, ${PRO} up to ${ROLLOVER_CAP[PRO]}; rolled-over credits expire after`,
				`  ${expiryLength} ${expiryType}${expiryLength === 1 ? "" : "s"}). When the cycle resets, Autumn grants the new`,
				"  cycle's credits and carries the unused amount over as a",
				"  separate rollover balance instead of deleting it.",
				"",
				`  This customer currently has ${balanceNow.remaining} credits unused,`,
				`  so at the reset ${Math.min(balanceNow.remaining, cap)} of them would roll over`,
				`  (the ${planNow} cap is ${cap}); the rest expire.`,
				"",
				"  A script cannot fast-forward a billing cycle, so this step",
				"  only reads the live balance. Re-run this script after the",
				"  reset date printed as `resets at` — the spend is recorded",
				"  locally and will not repeat — and the balance will show",
				"  a `rollovers` breakdown with the carried-over amount.",
			].join("\n"),
		);
	} else {
		console.log(
			"  no credit balance to read — if step 1 also found none, the" +
				" config was not pushed yet (`npx atmn push`)",
		);
	}
	printCreditBalance("before upgrade", customer);

	// ── Step 4 ──────────────────────────────────────────────────────────────
	heading("4", "Mid-cycle upgrade: Starter → Pro, keeping the balance");
	if (currentPlanIds(customer).includes(PRO)) {
		console.log("  already on Pro — nothing to do");
	} else {
		// Same `attach` call as step 1 — Autumn works out that this is an
		// upgrade because both plans are in the same group (`ai_app`).
		// Per the SDK's AttachParams docs, plan changes take effect
		// immediately for upgrades and are scheduled for the end of the
		// cycle for downgrades (the `planSchedule` default), and
		// `carryOverBalances` keeps the customer's remaining credits —
		// including any rolled-over ones — instead of letting the new
		// plan's 1,000-credit grant simply replace the old balance.
		const upgrade = await autumn.billing.attach({
			customerId: CUSTOMER_ID,
			planId: PRO,
			carryOverBalances: { enabled: true, featureIds: [CREDITS] },
		});
		if (upgrade.invoice) {
			console.log(
				`  invoice created: ${upgrade.invoice.total} ${upgrade.invoice.currency}` +
					` (status: ${upgrade.invoice.status ?? "unknown"})`,
			);
		}
		if (upgrade.paymentUrl) {
			console.log(
				[
					"  payment required to finish the upgrade:",
					`    ${upgrade.paymentUrl}`,
					"  open it, pay with a Stripe test card, then re-run this",
					"  script — every step is state-guarded, so the re-run picks",
					"  up where this one left off instead of starting over.",
				].join("\n"),
			);
			// The upgrade has not happened yet — Autumn is waiting on
			// the payment above — so this run did not finish the
			// scenario. Exit non-zero instead of printing the "Done"
			// summary and reporting success; the re-run after paying
			// completes the upgrade and exits 0.
			process.exitCode = 1;
			return;
		} else if (upgrade.invoice) {
			console.log(
				"  upgrade applied and charged — no payment action needed",
			);
		} else {
			console.log(
				"  attach returned no invoice or payment URL — the balance" +
					" below shows the resulting state",
			);
		}
	}
	customer = await autumn.customers.get({ customerId: CUSTOMER_ID });
	printCreditBalance("after Pro upgrade", customer);

	console.log(
		[
			"",
			"Done. The three cases, in one customer:",
			"  1. one credit pool, two features drawing at different rates;",
			"  2. unused credits roll over at reset (capped, with an expiry)",
			"     instead of vanishing;",
			"  3. a mid-cycle plan change carries the remaining balance over",
			"     — no product/price-ID rip-out in your own code, because",
			"     attach/check/track never change.",
			"",
			"What Autumn did: metering conversion, the rollover at reset,",
			"the plan swap. What this script did: gating, tracking — and",
			"the local completion state, because `track` has no idempotency key.",
		].join("\n"),
	);
}

main().catch((err) => {
	console.error("\nScenario failed:", err);
	process.exit(1);
});
