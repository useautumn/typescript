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
| optional provider idempotency key  | required durable `operationId` on mutations |
| implicit single-tenant identity    | required deliberate `operationNamespace`    |

Header overrides for `Authorization`, `Content-Type`, `X-API-Version` and
`Idempotency-Key` now fail during client construction.

`operationNamespace` names the Autumn organization and environment the client
operates on, and operation identity is derived from it. Pick a stable value that
survives a secret-key rotation. Two clients that share one installed component
need different namespaces, or they read each other's ledger entries.

## Generated action visibility

The generated surface fails closed. `autumn.api()` now returns only actions that
cannot change provider state: `check`, the four previews, `billingPortal`,
`getCustomer`, `getEntity`, `listEntities`, `getPlan`, `listPlans`, `listEvents`
and `aggregateEvents`. Every provider mutation moved to `autumn.internalApi()`,
which registers it as a Convex internal action: `consumeCheck`, `track`,
`attach`, `multiAttach`, `updateSubscription`, `multiUpdate`, `setupPayment`,
`getOrCreateCustomer`, `updateCustomer`, `deleteCustomer`, `createEntity`,
`updateEntity`, `deleteEntity`, `updateBalance`, `createReferralCode` and
`redeemReferralCode`.

Export both blocks from the same module, keep each name in the block it came
from, and call the mutations from server code through
`internal.<module>.<name>`.

Every internal action now requires a `customerId` argument. Convex does not
propagate the caller's auth into a scheduled or internal call, so `identify(ctx)`
cannot resolve a customer there and is not consulted. Authorize the request in
the mutation or action that still has an identity, resolve the subject there, and
pass it to the internal action. Public validators are unchanged and still accept
no customer ID.

A client that previously started checkout by calling `api.autumn.attach` now
calls your own authorized action, which runs `internal.autumn.attach`. That
action owns the decision, because the billing arguments include operator
controls such as `noBillingChanges`, `enablePlanImmediately`,
`refundLastPayment`, `recalculateBalances` and `carryOverUsages`.

`check` no longer takes `sendEvent` or `operationId`. A balance-consuming check
is the separate `consumeCheck` internal action and `autumn.consumeCheck` direct
method, which requires a durable `operationId`.

## Results and errors

Legacy `{ data, error, statusCode }` envelopes are gone. Direct methods resolve to
native camelCase SDK values and throw native SDK errors. HTTP 202 throws
`AutumnIndeterminateError`.

Generated actions return serializable native values. They throw safe
`ConvexError` data and use the component ledger to prevent an automatic retry
after a submitted operation has an unknown outcome. A claim taken by a process
that then died is recoverable once its lease expires, because such an operation
provably never reached Autumn.

## Method mapping

| Legacy method or action                     | 1.0.0 replacement                                                       |
| ------------------------------------------- | ----------------------------------------------------------------------- |
| `checkout`                                  | choose `previewAttach`, `attach`, `previewMultiAttach` or `multiAttach` |
| `attach`                                    | `billing.attach` direct method or `attach` action                       |
| `setupPayment`                              | `billing.setupPayment` direct method or `setupPayment` action           |
| `billingPortal` / `customers.billingPortal` | `billing.portal` direct method or `billingPortal` action                |
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
