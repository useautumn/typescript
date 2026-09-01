# Changelog

## 1.0.0 - 2026-09-01

- Replace the legacy wrapper with an explicit native-shape `autumn-js@1.2.55`
  subset.
- Add durable generated mutation actions with request conflict detection,
  terminal replay and indeterminate outcome handling.
- Pin Autumn API version 2.3.0, disable retries and fail-open behavior, and
  derive bounded provider idempotency keys from durable operation IDs.
- Add explicit billing preview, attach, multi-update, customer, entity, plan,
  balance, event and referral methods.
- Remove root checkout, compatibility helpers, implicit provisioning and legacy
  response envelopes.

## 0.0.0

- Initial release.
