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

Header overrides for `Authorization`, `Content-Type`, `X-API-Version` and
`Idempotency-Key` now fail during client construction.

## Results and errors

Legacy `{ data, error, statusCode }` envelopes are gone. Direct methods resolve to
native camelCase SDK values and throw native SDK errors. HTTP 202 throws
`AutumnIndeterminateError`.

Generated actions return serializable native values. They throw safe
`ConvexError` data and use the component ledger to prevent an automatic retry
after a submitted operation has an unknown outcome.

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
