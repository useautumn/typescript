# Autumn for Convex

`@useautumn/convex` exposes a supported subset of `autumn-js` through native
camelCase methods and generated Convex actions. Version 1.0.0 pins
`autumn-js@1.2.55` and the Autumn API contract at `2.3.0`.

This package is intentionally smaller than the full SDK. It does not create
customers or entities unless the caller selects the explicit operation that
creates them. Each method makes one Autumn request when transport is reached.
SDK retries and fail-open behavior are disabled.

## Install

```bash
pnpm add @useautumn/convex@1.0.0 convex
```

Add the component to `convex/convex.config.ts`:

```ts
import { defineApp } from "convex/server";
import autumn from "@useautumn/convex/convex.config";

const app = defineApp();
app.use(autumn);
export default app;
```

Create the client in `convex/autumn.ts`:

```ts
import { Autumn } from "@useautumn/convex";
import { components } from "./_generated/api";

export const autumn = new Autumn(components.autumn, {
  secretKey: process.env.AUTUMN_SECRET_KEY,
  identify: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;
    return {
      customerId: identity.subject,
      customerData: {
        name: identity.name,
        email: identity.email,
      },
    };
  },
});

export const {
  check,
  track,
  previewAttach,
  attach,
  previewMultiAttach,
  multiAttach,
  previewUpdate,
  updateSubscription,
  previewMultiUpdate,
  multiUpdate,
  setupPayment,
  billingPortal,
  getCustomer,
  getOrCreateCustomer,
  updateCustomer,
  deleteCustomer,
  createEntity,
  getEntity,
  listEntities,
  updateEntity,
  deleteEntity,
  getPlan,
  listPlans,
  updateBalance,
  listEvents,
  aggregateEvents,
  createReferralCode,
  redeemReferralCode,
} = autumn.api();
```

Every customer ID comes from `identify(ctx)`. Public arguments never accept a
customer ID.

## Direct methods

Direct methods return the native `autumn-js` result and throw native SDK errors.
They are intended for trusted server code. State-changing calls require a durable
caller-generated `operationId`:

```ts
const result = await autumn.track(ctx, {
  featureId: "messages",
  value: 1,
  operationId: jobId,
});

if (result.balance) {
  console.log(result.balance.remaining);
}
```

The package hashes the operation name, server-derived customer ID, canonical
request fingerprint and `operationId` into the provider `Idempotency-Key`. Raw
customer IDs and operation IDs are never placed in that header. Reusing an
`operationId` with different arguments is unsafe for direct methods because they
cannot access Convex storage. The derived provider key still changes with the
payload.

`check` is read-only by default and rejects `operationId`. Set `sendEvent: true`
with an `operationId` when the check should consume balance. HTTP 202 throws
`AutumnIndeterminateError` instead of returning a fail-open response.

## Generated action behavior

Generated mutation actions use the component-owned operation ledger. They claim
the operation before transport, record submission, and persist a serializable
terminal result or safe terminal error. A replay returns only a stored terminal
result. Claimed, submitted or indeterminate operations are never sent again.

HTTP 202, HTTP 409, HTTP 5xx, network failures, timeouts and aborts are stored as
indeterminate. Generated errors are `ConvexError` values whose data contains only:

```ts
{
  code: string;
  operation: string;
  statusCode?: number;
  message: string;
}
```

Native `Response`, `Request`, `Headers` and raw response bodies never cross an
action boundary.

## Supported methods

| Direct method                | Generated action      | Mutates               | Supported request fields                                                                                                             |
| ---------------------------- | --------------------- | --------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `check`                      | `check`               | only with `sendEvent` | feature, entity, required balance, properties, preview                                                                               |
| `track`                      | `track`               | yes                   | feature or event name, entity, value, properties, timestamp, overage behavior                                                        |
| `billing.previewAttach`      | `previewAttach`       | no                    | plan, entity, feature quantities, version, invoice and redirect settings, checkout settings, `longLivedCheckout`, metadata, currency |
| `billing.attach`             | `attach`              | yes                   | same supported shape as preview attach                                                                                               |
| `billing.previewMultiAttach` | `previewMultiAttach`  | no                    | plans with per-plan feature quantities, entity, invoice and redirect settings, currency                                              |
| `billing.multiAttach`        | `multiAttach`         | yes                   | same supported shape as preview multi-attach                                                                                         |
| `billing.previewUpdate`      | `previewUpdate`       | no                    | plan or subscription target, feature quantities, cancellation and proration settings                                                 |
| `billing.update`             | `updateSubscription`  | yes                   | same supported shape as preview update                                                                                               |
| `billing.previewMultiUpdate` | `previewMultiUpdate`  | no                    | plan-aware subscription cancellation updates                                                                                         |
| `billing.multiUpdate`        | `multiUpdate`         | yes                   | same supported shape as preview multi-update                                                                                         |
| `billing.setupPayment`       | `setupPayment`        | yes                   | plan, entity, feature quantities, checkout settings, currency                                                                        |
| `billing.portal`             | `billingPortal`       | no                    | configuration ID and return URL                                                                                                      |
| `customers.get`              | `getCustomer`         | no                    | expand                                                                                                                               |
| `customers.getOrCreate`      | `getOrCreateCustomer` | yes                   | identity fields, metadata, processor ID, currency, expand                                                                            |
| `customers.update`           | `updateCustomer`      | yes                   | identity fields, metadata, processor ID, currency                                                                                    |
| `customers.delete`           | `deleteCustomer`      | yes                   | processor deletion flag                                                                                                              |
| `entities.create`            | `createEntity`        | yes                   | entity ID, feature ID, name, supported billing controls                                                                              |
| `entities.get`               | `getEntity`           | no                    | entity ID                                                                                                                            |
| `entities.list`              | `listEntities`        | no                    | cursor, limit, plan filters, status, search, processors                                                                              |
| `entities.update`            | `updateEntity`        | yes                   | entity ID and supported billing controls                                                                                             |
| `entities.delete`            | `deleteEntity`        | yes                   | entity ID                                                                                                                            |
| `plans.get`                  | `getPlan`             | no                    | plan ID and version                                                                                                                  |
| `plans.list`                 | `listPlans`           | no                    | entity, archived and version filters                                                                                                 |
| `balances.update`            | `updateBalance`       | yes                   | one balance mutation plus target and reset fields                                                                                    |
| `events.list`                | `listEvents`          | no                    | cursor, limit, entity, features and custom range                                                                                     |
| `events.aggregate`           | `aggregateEvents`     | no                    | features, range, binning, grouping and filters                                                                                       |
| `referrals.create`           | `createReferralCode`  | yes                   | program ID                                                                                                                           |
| `referrals.redeem`           | `redeemReferralCode`  | yes                   | referral code                                                                                                                        |

`longLivedCheckout` is passed through unchanged to the native attach endpoint.
Its lifecycle and durability follow the configured billing provider's behavior.

## Unsupported SDK surface

The component does not expose cross-customer listing, customer ID overrides,
feature administration, plan administration, invoices, licenses, keys, rewards,
referral-program administration, RevenueCat platform operations, imports,
balance create/delete/finalize, schedules, AI token tracking, or raw request
options. Deep billing customization fields outside the table are also excluded.
Use `autumn-js` directly in trusted code when one of those operations is required.

There is no root `checkout` method and no compatibility namespace. Preview and
attach are separate operations.

## Transport options

The constructor accepts `serverURL`, optional additional headers, a custom
`fetcher` and `timeoutMs`. `Authorization`, `Content-Type`, `X-API-Version` and
`Idempotency-Key` header overrides are rejected case-insensitively.
