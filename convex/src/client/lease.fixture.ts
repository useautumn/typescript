import { componentsGeneric, internalActionGeneric } from "convex/server";
import { v } from "convex/values";
import { Autumn, type AutumnComponent } from "./index.js";

const components = componentsGeneric() as unknown as {
  autumn: AutumnComponent;
};

export const LEASE_NAMESPACE = "lease-fixture";
export const LEASE_CUSTOMER_ID = "customer-1";

const autumn = new Autumn(components.autumn, {
  secretKey: "test-secret-key",
  serverURL: "https://example.test",
  operationNamespace: LEASE_NAMESPACE,
  identify: async () => ({ customerId: LEASE_CUSTOMER_ID }),
});

export const { track } = autumn.internalApi();

/**
 * Direct access to the component ledger.
 *
 * A process that dies between claiming an operation and submitting it leaves a
 * claim behind that no running attempt owns. Nothing else can produce that
 * state, because the generated action takes both steps in one invocation, so
 * these actions write it the way the terminated attempt did.
 */
export const claimOperation = internalActionGeneric({
  args: {
    ledgerKey: v.string(),
    operation: v.string(),
    requestFingerprint: v.string(),
    attemptToken: v.string(),
  },
  handler: async (ctx, args) =>
    await ctx.runMutation(components.autumn.lib.claimOperation, args),
});

export const markSubmitted = internalActionGeneric({
  args: {
    ledgerKey: v.string(),
    requestFingerprint: v.string(),
    attemptToken: v.string(),
  },
  handler: async (ctx, args) =>
    await ctx.runMutation(components.autumn.lib.markSubmitted, args),
});

export const completeOperation = internalActionGeneric({
  args: {
    ledgerKey: v.string(),
    requestFingerprint: v.string(),
    attemptToken: v.string(),
  },
  handler: async (ctx, args) =>
    await ctx.runMutation(components.autumn.lib.completeOperation, {
      ...args,
      terminal: { state: "indeterminate" },
    }),
});
