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
import type { ActionCtx } from "./_generated/server";

export const autumn = new Autumn<ActionCtx>(components.autumn, {
  secretKey: process.env.AUTUMN_SECRET_KEY,
  operationNamespace: "acme-production",
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
  previewAttach,
  previewMultiAttach,
  previewUpdate,
  previewMultiUpdate,
  billingPortal,
  getCustomer,
  getEntity,
  listEntities,
  getPlan,
  listPlans,
  listEvents,
  aggregateEvents,
} = autumn.api();

export const {
  consumeCheck,
  track,
  attach,
  multiAttach,
  updateSubscription,
  multiUpdate,
  setupPayment,
  getOrCreateCustomer,
  updateCustomer,
  deleteCustomer,
  createEntity,
  updateEntity,
  deleteEntity,
  updateBalance,
  createReferralCode,
  redeemReferralCode,
} = autumn.internalApi();
```

Public actions and direct methods take their customer from `identify(ctx)`, and
their arguments never accept a customer ID.

## Operation namespace

`operationNamespace` is required and names the Autumn organization and
environment this client operates on. Choose it deliberately and keep it stable:
operation identity is derived from it, so changing it orphans every operation
recorded under the previous value, and deriving it from the secret key would
orphan them all on the next key rotation.

Two clients that share one installed component must not share a namespace. The
namespace separates their ledger entries and their provider idempotency keys, so
neither replays the other's stored result and neither reports a conflict against
the other. The namespace, the customer ID and the operation ID are hashed into
both keys, so none of them is stored or sent in readable form.

## Public and internal actions

The generated surface fails closed. `autumn.api()` returns public Convex actions
and contains only operations that cannot change provider state: previews, the
billing portal session, reads scoped to the customer that `identify(ctx)`
resolved, and plan catalog reads. Every provider mutation is in
`autumn.internalApi()`, which registers it with Convex `internalActionGeneric`.

Never move a name between the two export blocks. Visibility is decided by the
builder that registered the action, so exporting a mutation from the public
block would publish it under `api.<module>.<name>` and let any client call it.

Billing arguments carry operator controls such as `invoiceMode`,
`noBillingChanges`, `enablePlanImmediately`, `refundLastPayment`,
`recalculateBalances` and `carryOverUsages`. Any one of them changes what the
customer is billed without a payment, which is why `attach`, `multiAttach`,
`updateSubscription`, `multiUpdate` and `setupPayment` are internal rather than
client-callable. `track` is internal for the same reason: a negative `value`
returns balance to the customer, the grant `updateBalance` performs directly.

Public `check` is read-only by construction. Its validator has no `sendEvent`
and no `operationId`, so it cannot consume balance. Use the internal
`consumeCheck` action or the `autumn.consumeCheck` direct method when a check
should record usage.

Internal actions are published under `internal.<module>.<name>` and only server
code can reach them. Every one of them requires a `customerId`, because Convex
does not propagate the caller's auth into a scheduled or internal call and
`identify(ctx)` has nothing to resolve there. Authorize the request and resolve
the subject in the function that still has an identity, then pass it on:

```ts
export const recordMessages = mutation({
  args: { count: v.number() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Sign in to record messages.");
    const messageId = await ctx.db.insert("messages", { count: args.count });
    await ctx.scheduler.runAfter(0, internal.autumn.track, {
      customerId: identity.subject,
      featureId: "messages",
      value: args.count,
      operationId: messageId,
    });
    return null;
  },
});
```

The `customerId` identifies the operation and is stripped before the Autumn
request is built. It is the one place a customer ID may be supplied, and it is
reachable only from server code that has already decided the operation is
allowed.

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

The package hashes the operation namespace, operation name, server-derived
customer ID, canonical request fingerprint and `operationId` into the provider
`Idempotency-Key`. None of those values appears in that header in readable form.
Reusing an `operationId` with different arguments is unsafe for direct methods
because they cannot access Convex storage. The derived provider key still
changes with the payload.

`autumn.check` is read-only and takes no `operationId`. `autumn.consumeCheck`
records the usage event and requires one. HTTP 202 throws
`AutumnIndeterminateError` instead of returning a fail-open response.

## Generated action behavior

Generated mutation actions use the component-owned operation ledger. They claim
the operation before transport, record submission, and persist a serializable
terminal result or safe terminal error. A replay returns only a stored terminal
result. Submitted and indeterminate operations are never sent again.

A claim carries a lease and an attempt token. While the lease is live, another
invocation of the same operation reports an indeterminate outcome rather than
sending it, so two callers never race the same operation to Autumn. A process
that dies between claiming an operation and submitting it never sent it, and its
claim is recoverable: once the lease expires, the next invocation takes the claim
over with a token of its own. Submitting requires that token and a live lease, so
the attempt that was displaced cannot dispatch afterwards. The lease length is
the `CLAIM_LEASE_MS` constant in the component, and recovery waits for it to
expire. Nothing is retried automatically: a recovered claim is a new attempt
that has established the operation was never sent.

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

Every generated action resolves to the same native camelCase type as its direct
method, including a replayed terminal result, so callers read result fields
without an assertion. A result is validated with Convex's own value encoder
before it is stored or returned. One Convex refuses to encode, such as a
provider-supplied map key that starts with `$`, becomes an
`AUTUMN_RESULT_UNSERIALIZABLE` error and leaves the operation indeterminate
rather than failing at the outer action boundary.

## Supported methods

Every internal action additionally requires the trusted `customerId` described
above.

| Direct method                | Generated action      | Visibility | Supported request fields                                                                                                             |
| ---------------------------- | --------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `check`                      | `check`               | public     | feature, entity, required balance, properties, preview                                                                               |
| `consumeCheck`               | `consumeCheck`        | internal   | same fields as check, plus the required operation ID                                                                                 |
| `track`                      | `track`               | internal   | feature or event name, entity, value, properties, timestamp, overage behavior                                                        |
| `billing.previewAttach`      | `previewAttach`       | public     | plan, entity, feature quantities, version, invoice and redirect settings, checkout settings, `longLivedCheckout`, metadata, currency |
| `billing.attach`             | `attach`              | internal   | same supported shape as preview attach                                                                                               |
| `billing.previewMultiAttach` | `previewMultiAttach`  | public     | plans with per-plan feature quantities, entity, invoice and redirect settings, currency                                              |
| `billing.multiAttach`        | `multiAttach`         | internal   | same supported shape as preview multi-attach                                                                                         |
| `billing.previewUpdate`      | `previewUpdate`       | public     | plan or subscription target, feature quantities, cancellation and proration settings                                                 |
| `billing.update`             | `updateSubscription`  | internal   | same supported shape as preview update                                                                                               |
| `billing.previewMultiUpdate` | `previewMultiUpdate`  | public     | plan-aware subscription cancellation updates                                                                                         |
| `billing.multiUpdate`        | `multiUpdate`         | internal   | same supported shape as preview multi-update                                                                                         |
| `billing.setupPayment`       | `setupPayment`        | internal   | plan, entity, feature quantities, checkout settings, currency                                                                        |
| `billing.portal`             | `billingPortal`       | public     | configuration ID and return URL                                                                                                      |
| `customers.get`              | `getCustomer`         | public     | expand                                                                                                                               |
| `customers.getOrCreate`      | `getOrCreateCustomer` | internal   | identity fields, metadata, processor ID, currency, expand                                                                            |
| `customers.update`           | `updateCustomer`      | internal   | identity fields, metadata, processor ID, currency                                                                                    |
| `customers.delete`           | `deleteCustomer`      | internal   | processor deletion flag                                                                                                              |
| `entities.create`            | `createEntity`        | internal   | entity ID, feature ID, name, supported billing controls                                                                              |
| `entities.get`               | `getEntity`           | public     | entity ID                                                                                                                            |
| `entities.list`              | `listEntities`        | public     | cursor, limit, plan filters, status, search, processors                                                                              |
| `entities.update`            | `updateEntity`        | internal   | entity ID and supported billing controls                                                                                             |
| `entities.delete`            | `deleteEntity`        | internal   | entity ID                                                                                                                            |
| `plans.get`                  | `getPlan`             | public     | plan ID and version                                                                                                                  |
| `plans.list`                 | `listPlans`           | public     | entity, archived and version filters                                                                                                 |
| `balances.update`            | `updateBalance`       | internal   | one balance mutation plus target and reset fields                                                                                    |
| `events.list`                | `listEvents`          | public     | cursor, limit, entity, features and custom range                                                                                     |
| `events.aggregate`           | `aggregateEvents`     | public     | features, range, binning, grouping and filters                                                                                       |
| `referrals.create`           | `createReferralCode`  | internal   | program ID                                                                                                                           |
| `referrals.redeem`           | `redeemReferralCode`  | internal   | referral code                                                                                                                        |

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

The constructor requires `operationNamespace` and `identify`, and accepts
`serverURL`, optional additional headers, a custom `fetcher` and `timeoutMs`.
`Authorization`, `Content-Type`, `X-API-Version` and `Idempotency-Key` header
overrides are rejected case-insensitively.
