# Changelog

## 1.0.0 - 2026-09-01

- Replace the legacy wrapper with an explicit native-shape `autumn-js@1.2.55`
  subset.
- Add one-shot generated mutation actions that dispatch their request once and
  never retry an ambiguous outcome. Every generated action resolves to the
  native camelCase result type of its operation.
- Register every provider mutation as a Convex internal action through
  `autumn.internalApi()`, leaving only restricted previews, the portal session
  and reads of the identified customer, its entities, its events and the plan
  catalog on the public `autumn.api()` surface. Generated public actions omit
  billing operator controls retained by direct server methods, including the
  billing portal configuration ID.
- Split `check` into a read-only operation with no `sendEvent` or `operationId`
  and a balance-consuming `consumeCheck`.
- Validate every result with Convex's own value encoder before it is returned,
  and preserve the Convex value rather than its transport encoding.
- Validate every request before dispatch, rejecting `bigint`, `ArrayBuffer`,
  `NaN` and infinite numbers that Autumn cannot receive faithfully.
- Pin Autumn API version 2.3.0, disable retries and fail-open behavior, and
  derive bounded provider idempotency keys from caller-supplied operation IDs.
  Duplicate suppression is Autumn's, time-bounded, and does not replay the
  original result, so an ambiguous outcome is reported rather than retried.
- Require a deliberate `operationNamespace`, reject malformed Unicode operation
  identities before hashing, and derive the provider key from the namespace so
  clients that share one installed component never address each other's
  operations.
- Require a trusted `customerId` on every internal generated action, so one
  action serves both scheduled work, which carries no original user auth, and
  calls that still carry it. Strip the action's identity metadata before
  assembling the Autumn request.
- Add explicit billing preview, attach, multi-update, customer, entity, plan,
  balance, event and referral methods.
- Remove root checkout, compatibility helpers, implicit provisioning and legacy
  response envelopes.

## 0.0.0

- Initial release.
