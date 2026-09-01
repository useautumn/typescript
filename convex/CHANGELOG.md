# Changelog

## 1.0.0 - 2026-09-01

- Replace the legacy wrapper with an explicit native-shape `autumn-js@1.2.55`
  subset.
- Add durable generated mutation actions with request conflict detection,
  terminal replay and indeterminate outcome handling. Every generated action
  resolves to the native camelCase result type of its operation.
- Register every provider mutation as a Convex internal action through
  `autumn.internalApi()`, leaving only previews, the portal session and reads of
  the identified customer, its entities, its events and the plan catalog on the
  public `autumn.api()` surface.
- Split `check` into a read-only operation with no `sendEvent` or `operationId`
  and a balance-consuming `consumeCheck`.
- Validate every terminal result with Convex's own value encoder before it is
  stored or returned, and preserve the Convex value rather than its transport
  encoding.
- Pin Autumn API version 2.3.0, disable retries and fail-open behavior, and
  derive bounded provider idempotency keys from durable operation IDs.
- Require a deliberate `operationNamespace` and derive both the ledger key and
  the provider key from it, so clients that share one installed component never
  replay or conflict with each other.
- Lease every operation claim to the attempt that took it. A claim left behind
  by a process that died before submitting is reclaimed once its lease expires,
  and the displaced attempt can no longer dispatch the operation.
- Require a trusted `customerId` on every internal generated action, because
  Convex propagates no auth into a scheduled or internal call. It identifies the
  operation and is stripped before the Autumn request is built.
- Add explicit billing preview, attach, multi-update, customer, entity, plan,
  balance, event and referral methods.
- Remove root checkout, compatibility helpers, implicit provisioning and legacy
  response envelopes.

## 0.0.0

- Initial release.
