import { defineSchema } from "convex/server";

/**
 * The component stores nothing.
 *
 * Autumn owns the state of every operation this package performs, and the
 * package keeps no copy of it: a mutation is dispatched once per invocation and
 * carries a provider idempotency key instead of a local record. The component
 * exists so the client is installed under a Convex component namespace of its
 * own.
 */
export default defineSchema({});
