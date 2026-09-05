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

The component holds no tables and no functions. Autumn owns the state of every
operation, and this package keeps no copy of it.

Create the client in `convex/autumn.ts`:

```ts
import { Autumn } from "@useautumn/convex";
import { components } from "./_generated/api";
import type { ActionCtx } from "./_generated/server";

export const autumn = new Autumn<ActionCtx>(components.autumn, {
  secretKey: process.env.AUTUMN_SECRET_KEY,
  operationNamespace: "acme-production",
  // The deadline the SDK already applies to `check` and `track`, extended to
  // every operation: without one, a mutation Autumn has already applied can
  // outlive Convex's action limit, and the caller then gets a platform failure
  // carrying none of this package's error data instead of `AUTUMN_INDETERMINATE`.
  timeoutMs: 5_000,
  identify: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;
    return {
      customerId: identity.tokenIdentifier,
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
their arguments never accept a customer ID. The customer ID must be globally
unique across every configured identity provider, which `subject` is not.

## Operation namespace

`operationNamespace` is required and names the Autumn organization and
environment this client operates on. Choose it deliberately and keep it stable:
the provider idempotency key is derived from it, so changing it gives every
in-flight operation a new key, and deriving it from the secret key would do that
on the next key rotation.

Two clients that share one installed component must not share a namespace. The
namespace separates their provider idempotency keys, so one application's
operation ID can never suppress another's mutation at Autumn. The namespace,
mutation action and operation ID are hashed into the key, so none of them is sent
in readable form.

## Public and internal actions

The generated surface fails closed. `autumn.api()` returns public Convex actions
that reach only their allowlisted public routes. `check`, previews, and customer,
entity, and event reads use the customer resolved by `identify(ctx)`. `getPlan`
reads the global plan catalog without a customer. `listPlans` sends the customer
resolved by `identify(ctx)`, so its response carries that customer's eligibility
and the call fails when no customer resolves. `billingPortal` also uses the
resolved customer and is the explicit provider-session-creation exception
to read-only behavior. It sends `POST /v1/billing.open_customer_portal` to create
the session, but does not itself mutate subscriptions, balances, usage, entities,
or customer records. Every provider billing or data mutation is in
`autumn.internalApi()`, which registers it with Convex `internalActionGeneric`.

Never move a name between the two export blocks. Visibility is decided by the
builder that registered the action, so exporting a mutation from the public
block would publish it under `api.<module>.<name>` and let any client call it.

Direct billing methods accept operator controls such as `invoiceMode`,
`noBillingChanges`, `enablePlanImmediately`, `refundLastPayment`,
`subscriptionParams`, `recalculateBalances`, `carryOverUsages` and the portal
`configurationId`. Generated public actions omit those fields. Provider
mutations including `attach`, `multiAttach`, `updateSubscription`, `multiUpdate`
and `setupPayment` are internal. `track` is internal because a negative `value`
can return balance to the customer. `updateBalance` is separately internal
because it directly changes a balance or its grant configuration.

Public `check` is read-only by construction. Its validator has no `sendEvent`
and no `operationId`, so it cannot consume balance. Use the internal
`consumeCheck` action or the `autumn.consumeCheck` direct method when a check
should record usage.

Internal actions are published under `internal.<module>.<name>` and only server
code can reach them. Every one of them requires a `customerId` and never consults
`identify(ctx)`. A scheduled function runs without the original user's auth, so
no identity survives for it to resolve. An ordinary `ctx.runAction` call does
propagate the caller's auth, and taking the customer from the caller in both
cases is what lets one internal action serve scheduled and request-time work.
Authorize the request and resolve the subject in the function that owns that
decision, then pass it on:

```ts
export const recordMessages = mutation({
  args: { count: v.number() },
  returns: v.null(),
  handler: async (ctx, args) => {
    if (args.count < 0) throw new Error("Message count cannot be negative.");
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Sign in to record messages.");
    const messageId = await ctx.db.insert("messages", { count: args.count });
    await ctx.scheduler.runAfter(0, internal.autumn.track, {
      customerId: identity.tokenIdentifier,
      featureId: "messages",
      value: args.count,
      operationId: messageId,
    });
    return null;
  },
});
```

A scheduled action runs at most once, and a failed action is not retried. If the
usage write must survive a failure, keep an application-owned record and
reconcile it against Autumn.

The internal action's `customerId` and `operationId` metadata are stripped
before its Autumn request shape is assembled. The trusted customer value is then
added only as the request's subject. This is the one place a customer ID may be
supplied, and it is reachable only from server code that has already decided the
operation is allowed.

## Direct methods

Direct methods return the native `autumn-js` result and throw native SDK errors.
They are intended for trusted server code. State-changing calls require a
caller-generated `operationId` that is stable across repeated attempts at the
same logical operation, such as the ID of the document the work belongs to:

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

The package hashes the operation namespace, mutation action and `operationId`
into the provider `Idempotency-Key`. None of those values appears in that header
in readable form. An `operationId` must be unique within its
`operationNamespace` and mutation action across all customers. The request
payload and customer ID are not part of the key, so changing the customer or
arguments does not create a new key. Autumn rejects the reused key as a duplicate
instead of performing a second mutation.

`autumn.check` is read-only and takes no `operationId`. `autumn.consumeCheck`
records the usage event and requires one. HTTP 202, malformed success JSON and an
unreadable body under HTTP 2xx, 409 or 5xx throw `AutumnIndeterminateError`
instead of returning a fail-open response.

## Duplicate suppression and its limits

This package stores nothing. Every mutation is one shot: it sends its request
once per invocation and reports what it saw. Duplicate suppression is entirely
Autumn's, through the `Idempotency-Key` header, and it is time-bounded. Autumn
[currently rejects a key it has already seen within 24 hours with HTTP 409](https://docs.useautumn.com/documentation/customers/edge-cases)
and does not return the original operation's result with it. Past that window
the same key is a new operation.

For generated actions, read that as duplicate suppression, never as durable
recovery or exactly-once execution:

- An outcome the package cannot read is reported as `AUTUMN_INDETERMINATE` and
  left there. HTTP 202, HTTP 409, HTTP 5xx, malformed success responses, network
  failures, timeouts and aborts all land here.
- Nothing is retried, in place or on a schedule. HTTP 429 also fails closed
  without an automatic retry. Whether an ambiguous operation took effect is
  knowable only from Autumn, so the decision belongs to the caller.
- A retried invocation is a new request under the same key. Inside the duplicate
  window it is rejected rather than replayed, so a caller that repeats a
  mutation to obtain its result gets an error, not the result.
- Reconcile an indeterminate operation by reading the customer's state back from
  Autumn before deciding to send it again.

Direct methods differ: HTTP 202, malformed success JSON and an unreadable body
under HTTP 2xx, 409 or 5xx become `AutumnIndeterminateError`; the other failures
above remain native SDK errors.

Generated action errors are `ConvexError` values whose data contains only:

```ts
{
  code: string;
  operation: string;
  statusCode?: number;
  message: string;
}
```

A request the SDK rejects against its own schema before opening a connection is
reported as `AUTUMN_VALIDATION_ERROR` with no `statusCode`, because Autumn never
received it. This covers shapes the Convex validators admit and the SDK's schema
does not, such as a fractional `timestamp` where an integer is required. The
SDK's own message is not passed through, since it can embed the offending value.
Direct methods are unaffected and keep throwing the native SDK error.

A `ConvexError` thrown by `identify(ctx)` passes through unchanged. Any other
error it throws is reported as `AUTUMN_REQUEST_FAILED` with no `statusCode`, even
when it carries one: that status belongs to whatever service identification
consulted, and the operation never reached Autumn. One thrown by a custom
`fetcher` does not pass through: the SDK wraps anything the fetcher throws in a
client error of its own, so it arrives here as a transport failure and is
reported as `AUTUMN_INDETERMINATE` like any other unreadable outcome.

Native `Response`, `Request`, `Headers` and raw response bodies never cross an
action boundary.

Every generated action resolves to the same native camelCase type as its direct
method, so callers read result fields without an assertion. A result is validated
with Convex's own value encoder before it is returned. One Convex refuses to
encode, such as a provider-supplied map key that starts with `$`, becomes an
`AUTUMN_RESULT_UNSERIALIZABLE` error rather than an opaque failure at the outer
action boundary. The operation itself already reached Autumn in that case. That
check covers the encoder's per-value grammar and not the platform's own size and
depth limits, which `convexToJson` does not enforce (measured against convex
1.29.3), so a result long or deeply nested enough still fails at the outer
boundary.

## Supported methods

Every internal action additionally requires the trusted `customerId` described
above. Direct billing methods accept the complete supported SDK subset, while
the generated public actions omit billing operator controls. Anywhere in a
request, including inside a class instance, `bigint`, `ArrayBuffer`, `NaN` and
infinite numbers are rejected because Autumn cannot receive them faithfully. A
`BigInt64Array` or `BigUint64Array` is rejected for the same reason, since every
element of one is a `bigint`. A request that refers back to itself is rejected
too, because the SDK stringifies it and a cycle cannot be stringified; a value
shared by two fields without forming a cycle is accepted. Any other typed array
is left to the SDK, which sends a `Uint8Array` as base64. Generated actions
otherwise use their Convex validators. Direct methods retain the native SDK's
request types and handling of `Date`, `Uint8Array`, class instances and
`undefined`. Pass only declared fields to a direct method. A value in an
undeclared field is validated even though the SDK drops that field before
sending the request, so `bigint`, `ArrayBuffer`, `NaN` or an infinite number
there rejects the call.

| Direct method                | Generated action      | Visibility | Supported request fields                                                                                           |
| ---------------------------- | --------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------ |
| `check`                      | `check`               | public     | feature, entity, required balance, properties, preview                                                             |
| `consumeCheck`               | `consumeCheck`        | internal   | same fields as check, plus the required operation ID                                                               |
| `track`                      | `track`               | internal   | feature or event name, entity, value, properties, timestamp, overage behavior                                      |
| `billing.previewAttach`      | `previewAttach`       | public     | plan, entity, feature quantities, version, redirect and checkout settings, `longLivedCheckout`, metadata, currency |
| `billing.attach`             | `attach`              | internal   | same supported shape as preview attach                                                                             |
| `billing.previewMultiAttach` | `previewMultiAttach`  | public     | plans with per-plan feature quantities, entity, redirect and checkout settings, currency                           |
| `billing.multiAttach`        | `multiAttach`         | internal   | same supported shape as preview multi-attach                                                                       |
| `billing.previewUpdate`      | `previewUpdate`       | public     | plan or subscription target, feature quantities, cancellation, proration and redirect settings                     |
| `billing.update`             | `updateSubscription`  | internal   | same supported shape as preview update                                                                             |
| `billing.previewMultiUpdate` | `previewMultiUpdate`  | public     | plan-aware subscription cancellation updates                                                                       |
| `billing.multiUpdate`        | `multiUpdate`         | internal   | same supported shape as preview multi-update                                                                       |
| `billing.setupPayment`       | `setupPayment`        | internal   | plan, entity, feature quantities, checkout settings, currency                                                      |
| `billing.portal`             | `billingPortal`       | public     | return URL; direct method also accepts configuration ID                                                            |
| `customers.get`              | `getCustomer`         | public     | expand                                                                                                             |
| `customers.getOrCreate`      | `getOrCreateCustomer` | internal   | identity fields, metadata, processor ID, currency, expand                                                          |
| `customers.update`           | `updateCustomer`      | internal   | identity fields, metadata, processor ID, currency                                                                  |
| `customers.delete`           | `deleteCustomer`      | internal   | processor deletion flag                                                                                            |
| `entities.create`            | `createEntity`        | internal   | entity ID, feature ID, name, supported billing controls                                                            |
| `entities.get`               | `getEntity`           | public     | entity ID                                                                                                          |
| `entities.list`              | `listEntities`        | public     | cursor, limit, plan filters, status, search, processors                                                            |
| `entities.update`            | `updateEntity`        | internal   | entity ID and supported billing controls                                                                           |
| `entities.delete`            | `deleteEntity`        | internal   | entity ID                                                                                                          |
| `plans.get`                  | `getPlan`             | public     | plan ID and version                                                                                                |
| `plans.list`                 | `listPlans`           | public     | entity, archived and version filters                                                                               |
| `balances.update`            | `updateBalance`       | internal   | optional balance, grant, target, reset and expiry changes                                                          |
| `events.list`                | `listEvents`          | public     | cursor, limit, entity, features and custom range                                                                   |
| `events.aggregate`           | `aggregateEvents`     | public     | features, range, binning, grouping and filters                                                                     |
| `referrals.create`           | `createReferralCode`  | internal   | program ID                                                                                                         |
| `referrals.redeem`           | `redeemReferralCode`  | internal   | referral code                                                                                                      |

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

Set `timeoutMs` explicitly. Without it, `check`, `consumeCheck` and `track` have
the SDK's five-second timeout; every other operation waits indefinitely. This is
especially important for `consumeCheck`, because Autumn may have recorded the
usage event before the request aborts. If a call outlives Convex's action
execution limit, the platform reports its failure instead of an
`AUTUMN_INDETERMINATE` error.

The SDK's `AUTUMN_DEBUG` request logging is suppressed. The client is always
built with a logger of this package's own, so the SDK's fallback to `console`
cannot engage: that logging prints the `Authorization` header, and therefore the
Autumn secret key, along with request and response bodies, none of which this
package otherwise lets cross a boundary. In Convex that console is the
deployment log. Debug an exchange through a custom `fetcher` instead, which sees
the same requests and controls its own redaction.
