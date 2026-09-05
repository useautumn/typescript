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
  and preserve the Convex value rather than its transport encoding. The encoder
  supplies the per-value grammar only: it enforces no size or nesting-depth
  limit, so a large or deeply nested result still fails at the outer action
  boundary.
- Validate every request before dispatch, rejecting `bigint`, `ArrayBuffer`,
  `NaN` and infinite numbers that Autumn cannot receive faithfully, wherever
  they sit. A class instance is inspected like the plain object the SDK's
  `JSON.stringify` treats it as, a `BigInt64Array` or `BigUint64Array` is
  rejected because every element of one is a `bigint`, and a request that refers
  back to itself is rejected as a value it cannot carry faithfully instead of
  reaching the SDK, whose `JSON.stringify` throws outside its guarded region. A
  value shared by two fields without forming a cycle stays acceptable and is
  walked once.
- Read a status only from an error Autumn's SDK or this package raised, so a
  failure of the caller's `identify(ctx)` that carries a status of its own is no
  longer reported as an indeterminate Autumn outcome for an operation that never
  existed. Classify a transport failure by the SDK's own error classes rather
  than by error name, for the same reason: those four names are Speakeasy's
  standard generated ones, so an error raised by any other Speakeasy-generated
  SDK reached the classifier carrying them and reported that Autumn may have
  applied an operation it never received.
- Always supply the SDK client with a logger of this package's own, so the
  SDK's `AUTUMN_DEBUG` fallback to `console` cannot print the `Authorization`
  header, and with it the Autumn secret key, or request and response bodies into
  the Convex deployment log.
- Report a request the SDK rejects against its own schema before sending it as
  `AUTUMN_VALIDATION_ERROR` rather than blaming Autumn for a request it never
  received. The SDK's message is not passed through, since it can embed the
  offending value, and direct methods keep throwing the native SDK error.
- Pin Autumn API version 2.3.0, disable retries and fail-open behavior, and
  derive bounded provider idempotency keys from caller-supplied operation IDs.
  Duplicate suppression is Autumn's, time-bounded, and does not replay the
  original result, so an ambiguous outcome is reported rather than retried.
- Throw `AutumnIndeterminateError` from a direct method when a body that could
  not be read leaves an HTTP 2xx, 409 or 5xx outcome open, so trusted server
  code reads the status Autumn sent instead of a native client error without
  one. A definitive rejection such as HTTP 422 keeps its native SDK error.
- Require a deliberate `operationNamespace`, reject malformed Unicode operation
  identities before hashing, and derive the provider key from the namespace, the
  trusted customer, the mutation action and the operation ID. Clients that share
  one installed component never address each other's operations, and neither do
  two customers of one client: an `operationId` has to be unique per customer,
  per namespace and per mutation action rather than globally. The request payload
  stays out of the key, so a retry that corrects its arguments is still the same
  operation and still meets Autumn's duplicate rejection.
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
