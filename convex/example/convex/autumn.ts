import { Autumn } from "@useautumn/convex";
import { v } from "convex/values";
import { components, internal } from "./_generated/api.js";
import { action, type ActionCtx, mutation } from "./_generated/server.js";

export const autumn = new Autumn<ActionCtx>(components.autumn, {
  secretKey: process.env.AUTUMN_SECRET_KEY,
  // Deliberate, stable, and independent of the secret key: the provider
  // idempotency key is derived from it, so rotating the key must not change it.
  operationNamespace: "example-app-production",
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

const APP_ORIGIN = "https://app.example.com";

/**
 * Portal creation is application-owned because authentication alone does not
 * establish a billing role. The browser supplies neither the customer nor the
 * return URL: this action authorizes the role, `identify(ctx)` resolves the
 * customer, and the application constructs an allowlisted destination.
 */
export const openBillingPortal = action({
  args: {},
  returns: v.string(),
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Sign in to manage billing.");
    if (identity.role !== "billing_admin") {
      throw new Error("You are not allowed to manage billing.");
    }

    const portal = await autumn.billing.portal(ctx, {
      returnUrl: new URL("/settings/billing", APP_ORIGIN).toString(),
    });
    return portal.url;
  },
});

/** Results keep the native camelCase fields, so no caller assertion is needed. */
export const messagesAllowed = action({
  args: {},
  returns: v.boolean(),
  handler: async (ctx) => {
    const result = await autumn.check(ctx, { featureId: "messages" });
    return result.allowed;
  },
});

/**
 * Convex runs a scheduled function without the caller's auth, so this mutation
 * authorizes the request and resolves the subject while it still has one, then
 * hands that customer to the internal action. The document it just wrote is the
 * operation ID: it is stable across attempts, so a repeated schedule inside
 * Autumn's duplicate window reaches it under the same idempotency key and is
 * rejected there rather than recording usage a second time. That window is
 * time-bounded, so it suppresses duplicates and is no durable exactly-once
 * guarantee; the README describes the limits.
 *
 * The tracked value is a client argument here only to keep the example short. A
 * production handler derives it from the work the server actually performed, so
 * that a caller cannot report a usage figure of its own choosing.
 */
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
