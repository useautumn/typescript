# Example: AI credits with rollovers and a mid-cycle plan change

A complete worked example of an AI app billing on [Autumn](https://useautumn.com): one shared credit pool, unused credits that **roll over** at the monthly reset, and a **mid-cycle upgrade** that charges for the plan change and carries the remaining balance over.

On raw Stripe, each of these is a project of its own — new product/price IDs on every pricing change, webhook handlers to sync state, cron jobs to reset balances, and your own logic for what happens to unused credits when a customer changes plan mid-cycle. Here, the pricing is one config file. The scenario creates its demo customer (`customers.getOrCreate`); after that, the calls that change billing state are `billing.attach` and `track`. `check` only asks whether a spend is allowed, and state is read back with `customers.get`.

## The setup

Pricing lives in [`autumn.config.ts`](./autumn.config.ts), declared as code with the `atmn` CLI package:

- **Two metered features** — `basic_model` and `premium_model`.
- **One credit system** — `credits`, where a basic request costs 1 credit and a premium request costs 10. Both plans grant this single pool.
- **Two plans in one group** (`ai_app`), so attaching one replaces the other:
  - **Starter** (free, auto-enabled): 200 credits/month, rollover capped at 100.
  - **Pro** ($20/month): 1,000 credits/month, rollover capped at 500.
- **Rollover** is configured on the plan item: up to the cap, unused credits carry into the next cycle as a separate rollover balance instead of expiring; rolled-over credits themselves expire after 1 month.

## Versions

`package.json` pins exact versions, and `package-lock.json` is committed, so the example runs against what it was verified with:

- **`atmn` 1.1.25** — the final release of the 1.1.x compose API (`feature` / `plan` / `item`). This is the line this repo's own `nextjs/` example app resolves (`atmn: ^1.1.1`). Note that `atmn` 2.x changed the config API surface (generated builders, no root-level `item`); this example does not target it.
- **`autumn-js` 1.5.18** — the current published SDK.

## Run it

You need an Autumn sandbox (test mode) — no real money moves.

```bash
npm install

# 1. Push the pricing config to your sandbox
npx atmn login   # first time only
npx atmn preview # renders the plans from the config locally, no account needed
npx atmn push

# 2. Run the narrated scenario
cp .env.example .env   # add your sandbox secret key (am_sk_test_...)
npm run scenario
```

`atmn preview` output for this config (actual):

```
╭ Pro ─────────────────────────────────╮
│ $20/month                            │
│ └─ 1,000 AI Credits per month        │
╰──────────────────────────────────────╯

╭ Starter ─────────────────────────────╮
│ Free                                 │
│ └─ 200 AI Credits per month          │
╰──────────────────────────────────────╯
```

### Offline check (no account needed)

```bash
npm run verify:config   # asserts the config the atmn builders produce
npm run typecheck       # tsc --noEmit, strict, against the published typings
```

`verify:config` checks the three properties the scenario relies on — the credit schema (1 / 10 credits), both plans' grants, monthly resets and rollover caps, and the shared plan group. It tests the *config*, not Autumn's servers; see "What is verified" below.

## What the scenario does

[`src/scenario.ts`](./src/scenario.ts) walks one customer through the three cases, printing the credit balance after each step:

1. **Credit pool in action.** The customer starts on Starter, spends 40 basic requests (40 credits) and 6 premium requests (60 credits). Your code gates on the pool itself — `check` against the credit system for the spend's total cost — then tracks the *underlying features*; Autumn converts usage to credits. Expected balance after this step on a fresh customer: granted 200, used 100, remaining 100.
2. **Rollover.** Nothing to call — rollover is config, not code. When the cycle resets, Autumn grants the new cycle's credits and carries unused credits (up to the cap) over as a separate rollover balance, visible in the balance's `rollovers` breakdown. A script can't fast-forward a billing cycle, so the scenario prints the live balance, the reset date, and exactly how many of the current unused credits would roll over; re-run it after that date to see a real rollover entry.
3. **Mid-cycle plan change.** The customer upgrades to Pro with one more `billing.attach` call, using `carryOverBalances` so the remaining credits — including any rolled-over ones — survive instead of being replaced by the new plan's grant. The script prints the invoice Autumn creates for the change (amount and status), so the charge for the remaining cycle time is observed, not assumed. (Per the SDK's `AttachParams` docs, upgrades apply immediately by default; downgrades are scheduled for the end of the cycle.)

### What Autumn does vs. what your code does

Autumn (the provider): metering conversion into credits, balance resets and rollovers, the plan swap and its invoice.

Your code (the app): gating with `check`, recording usage with `track` — and duplicate protection. **`track` has no idempotency key: call it twice and you deduct twice.** Balance `usage` cannot serve as the guard either: it is scoped to the current billing cycle, so after a reset it reads zero even though the spend already happened. The scenario therefore guards the plan steps with the customer's live state and records each completed `track` step in a local state file (`.demo-state.json`, gitignored), which is also what makes it safe to re-run (next section). Treat that state file as part of the pattern, not scaffolding.

## Re-running, and the payment step

The script is safe to run repeatedly: plan steps are skipped when the customer's live state already reflects them, and each `track` step is skipped when it is recorded in `.demo-state.json`. A run that stops halfway resumes with only the remainder.

The state file is tied to the key it was written under — it stores a SHA-256 fingerprint of the key, never the key itself — so recorded steps are ignored when you run with a different sandbox's key; usage that customer already has under the new key is adopted from the live balance instead. And if the state file is corrupt or unreadable, the script stops with an error rather than guessing: a wrong guess could record the spend twice.

To replay the spend from scratch, delete `.demo-state.json` **and** start from a fresh customer (or nuke the sandbox with `npx atmn nuke`). Do not delete the state file on its own against a customer who has already spent: the state file is the duplicate protection, and without it the spend is tracked — and deducted — a second time.

If the demo customer has no payment method, the Pro upgrade cannot complete: `billing.attach` returns a **payment URL** instead of an invoice. The script prints it — open it, pay with a Stripe test card (e.g. `4242 4242 4242 4242`), then run the script again; it picks up at the upgrade instead of starting over.

Exit codes match completion: a run that stops early — the step-2 `check` denies the spend, or the upgrade is waiting on the payment above — exits non-zero. Only a run that completes every step (or finds every step already done) exits 0.

## Troubleshooting

- **`Scenario failed: ... Status 401`** — the key in `.env` is wrong, or belongs to a different environment. The scenario expects a sandbox secret key (`am_sk_test_...`) for the same organisation you pushed the config to.
- **`no credit balance found`** — the config was not pushed yet (`npx atmn push`), or the demo customer was created before the push and never got a plan. Push first, then re-run; or nuke the sandbox (`npx atmn nuke`) and start clean.
- **Balance doesn't show rollovers** — rollovers only exist after a real cycle reset. Check the `resets at` date the script prints; before that date there is nothing to see.
- **`AUTUMN_SECRET_KEY is not a sandbox (test-mode) key`** — the scenario refuses non-test keys, because the plan upgrade charges real money against a live organisation. Use a sandbox key (`am_sk_test_...`); only if you deliberately want a live run, set `AUTUMN_ALLOW_LIVE_KEY=1`.

## What is verified

Verified without an account: `npm run verify:config` (config assertions against the real `atmn` builders), `npm run typecheck` (strict, against the published `atmn@1.1.25` / `autumn-js@1.5.18` typings), and `npx atmn preview` (renders both plans from the config).

Not verified here, because it needs a sandbox key: the live flow — `atmn push`, real `attach` / `check` / `track` calls, the prorated upgrade charge, and an actual rollover at a cycle reset. The scenario prints the live balance and the attach invoice at every step so the first keyed run is self-checking; to validate the rollover end to end, run it once, note the `resets at` date, and run it again after that date — the balance should then show a `rollovers` entry.
