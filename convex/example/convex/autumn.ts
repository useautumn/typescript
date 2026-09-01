import { Autumn } from "@useautumn/convex";
import { v } from "convex/values";
import { components, internal } from "./_generated/api.js";
import { action, type ActionCtx, mutation } from "./_generated/server.js";

export const autumn = new Autumn<ActionCtx>(components.autumn, {
  secretKey: process.env.AUTUMN_SECRET_KEY,
  // Deliberate, stable, and independent of the secret key: the provider
  // idempotency key is derived from it, so rotating the key must not change it.
  operationNamespace: "example-app-production",
  identify: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;
    return {
      customerId: identity.subject,
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
 * operation ID: it is stable across attempts, so a repeated schedule reaches
 * Autumn under the same idempotency key and is rejected there rather than
 * recording usage a second time.
 */
export const recordMessages = mutation({
  args: { count: v.number() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Sign in to record messages.");
    const messageId = await ctx.db.insert("messages", { count: args.count });
    await ctx.scheduler.runAfter(0, internal.autumn.track, {
      customerId: identity.subject,
      featureId: "messages",
      value: args.count,
      operationId: messageId,
    });
    return null;
  },
});
