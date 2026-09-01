import { Autumn } from "@useautumn/convex";
import { v } from "convex/values";
import { components } from "./_generated/api.js";
import { action, type ActionCtx } from "./_generated/server.js";

export const autumn = new Autumn<ActionCtx>(components.autumn, {
  secretKey: process.env.AUTUMN_SECRET_KEY,
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
