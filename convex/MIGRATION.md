# Migrating to 1.0.0

Version 1.0.0 is a deliberate breaking release. It removes the legacy response
envelope and compatibility helpers in favor of the native `autumn-js@1.2.55`
contract.

## Configuration

| Before 1.0.0                       | 1.0.0                                       |
| ---------------------------------- | ------------------------------------------- |
| `url`                              | `serverURL`                                 |
| SDK version range or workspace SDK | exact runtime dependency `autumn-js@1.2.55` |
| caller-provided customer fields    | customer ID from `identify(ctx)`            |
| optional provider idempotency key  | required stable `operationId` on mutations  |
| implicit single-tenant identity    | required deliberate `operationNamespace`    |

Header overrides for `Authorization`, `Content-Type`, `X-API-Version` and
`Idempotency-Key` now fail during client construction.

`operationNamespace` names the Autumn organization and environment the client
operates on, and the provider idempotency key is derived from it. Pick a stable
value that survives a secret-key rotation. Two clients that share one installed
component need different namespaces, or one application's operation ID can
suppress the other's mutation at Autumn.

## Generated action visibility

The generated surface fails closed. `autumn.api()` now returns actions restricted
to their allowlisted public routes. `check`, the four previews, `getCustomer`,
`getEntity`, `listEntities`, `listEvents` and `aggregateEvents` use the customer
resolved by `identify(ctx)`. `getPlan` reads the global plan catalog without a
customer. `listPlans` sends the customer resolved by `identify(ctx)`, so its
response carries that customer's eligibility and the call fails when no customer
resolves. `billingPortal` also uses the resolved customer and is the
explicit provider-session-creation exception to read-only behavior: it sends
`POST /v1/billing.open_customer_portal` to create the session, without itself
mutating subscriptions, balances, usage, entities, or customer records. Every
provider billing or data mutation moved to `autumn.internalApi()`, which
registers it as a Convex internal action: `consumeCheck`, `track`, `attach`,
`multiAttach`, `updateSubscription`, `multiUpdate`, `setupPayment`,
`getOrCreateCustomer`, `updateCustomer`, `deleteCustomer`, `createEntity`,
`updateEntity`, `deleteEntity`, `updateBalance`, `createReferralCode` and
`redeemReferralCode`.

Export both blocks from the same module, keep each name in the block it came
from, and call the mutations from server code through
`internal.<module>.<name>`.

Every internal action now requires a `customerId` argument. Convex does not
propagate the caller's auth into a scheduled or internal call, so `identify(ctx)`
cannot resolve a customer there and is not consulted. Authorize the request in
the mutation or action that still has an identity, resolve the customer there,
and pass it to the internal action. Public validators accept no customer ID, and
generated public billing actions omit operator controls, including the portal
configuration ID. Internal generated actions keep them, because only server code
that has already authorized the request can reach one.

A client that previously started checkout by calling `api.autumn.attach` now
calls your own authorized action, which runs `internal.autumn.attach`. That
action owns the decision, because the billing arguments include operator
controls such as `noBillingChanges`, `enablePlanImmediately`,
`refundLastPayment`, `subscriptionParams`, `recalculateBalances` and
`carryOverUsages`.

`check` no longer takes `sendEvent` or `operationId`. A balance-consuming check
is the separate `consumeCheck` internal action and `autumn.consumeCheck` direct
method, which requires an `operationId`.

## Results and errors

Legacy `{ data, error, statusCode }` envelopes are gone. Direct methods resolve to
native camelCase SDK values and throw native SDK errors once a request reaches
Autumn. A failure this package detects first keeps its own class:
`AutumnValidationError` for a rejected argument, `AutumnConfigurationError` for an
unusable client or identity, and `AutumnIndeterminateError` for HTTP 202 and
malformed success JSON.

Generated actions return serializable native values and throw safe `ConvexError`
data. Each of them is one shot: it dispatches its request once and never retries
an ambiguous outcome such as HTTP 202, HTTP 409, an HTTP 5xx, a malformed
success response, a timeout or a dropped connection. HTTP 429 also fails closed
without an automatic retry. Duplicate suppression is Autumn's, through the
derived `Idempotency-Key`, and it is time-bounded (Autumn rejects a key it has already seen within 24 hours with HTTP 409) and does not replay the original
result. A caller that repeats a mutation after an unknown outcome must reconcile
it against Autumn first. See the README section on duplicate suppression and its
limits.

## Method mapping

| Legacy method or action                     | 1.0.0 replacement                                                       |
| ------------------------------------------- | ----------------------------------------------------------------------- |
| `checkout`                                  | choose `previewAttach`, `attach`, `previewMultiAttach` or `multiAttach` |
| `attach`                                    | `billing.attach` direct method or `attach` action                       |
| `setupPayment`                              | `billing.setupPayment` direct method or `setupPayment` action           |
| `billingPortal` / `customers.billingPortal` | `billing.portal`; public `billingPortal` omits `configurationId`        |
| `createCustomer`                            | `customers.getOrCreate` direct method or `getOrCreateCustomer` action   |
| `listProducts` / `products.list`            | `plans.list` direct method or `listPlans` action                        |
| `products.get`                              | `plans.get` direct method or `getPlan` action                           |
| `usage`                                     | `balances.update` direct method or `updateBalance` action               |
| `cancel`                                    | `billing.update` or `billing.multiUpdate` with `cancelAction`           |
| `query`                                     | `events.aggregate`                                                      |
| `referrals.createCode`                      | `referrals.create`                                                      |
| `referrals.redeemCode`                      | `referrals.redeem`                                                      |

Entity list and update operations are now explicit. Billing previews never attach
or update a subscription. Attach and update operations never perform a preview
first.

## Removed behavior

The 1.0.0 component does not perform read-before-create, automatic customer or
entity provisioning, fallback mutations, composite checkout flows, response
capture wrappers, automatic retries, or snake-case envelope conversion.

See the unsupported SDK surface in the README before upgrading. There is no
compatibility namespace for removed methods.
