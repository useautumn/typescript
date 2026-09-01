import { v } from "convex/values";
import { mutation } from "./_generated/server.js";

/**
 * How long a claimed operation stays reserved for the attempt that took it.
 *
 * An attempt claims the operation and then marks it submitted, and only the
 * holder of the live lease may take that second step. The window has to outlast
 * the gap between those two mutations so that a healthy attempt is never fenced
 * out by a competitor, and it is also how long a caller waits for an operation
 * whose attempt died in that gap, because nothing may take the claim over until
 * the lease runs out.
 */
export const CLAIM_LEASE_MS = 60_000;

const errorData = v.object({
  code: v.string(),
  operation: v.string(),
  statusCode: v.optional(v.number()),
  message: v.string(),
});
const claimResult = v.union(
  v.object({ state: v.literal("claimed") }),
  v.object({ state: v.literal("conflict") }),
  v.object({ state: v.literal("pending") }),
  v.object({ state: v.literal("indeterminate") }),
  v.object({ state: v.literal("succeeded"), result: v.any() }),
  v.object({ state: v.literal("failed"), error: errorData })
);

export const claimOperation = mutation({
  args: {
    ledgerKey: v.string(),
    operation: v.string(),
    requestFingerprint: v.string(),
    attemptToken: v.string(),
  },
  returns: claimResult,
  handler: async (ctx, args) => {
    // Leases are written and compared against the transaction's own clock,
    // never against a timestamp the calling process supplied.
    const now = Date.now();
    const existing = await ctx.db
      .query("operations")
      .withIndex("ledgerKey", (query) => query.eq("ledgerKey", args.ledgerKey))
      .unique();

    if (!existing) {
      await ctx.db.insert("operations", {
        ledgerKey: args.ledgerKey,
        operation: args.operation,
        requestFingerprint: args.requestFingerprint,
        state: "claimed",
        attemptToken: args.attemptToken,
        leaseExpiresAt: now + CLAIM_LEASE_MS,
      });
      return { state: "claimed" as const };
    }
    if (
      existing.operation !== args.operation ||
      existing.requestFingerprint !== args.requestFingerprint
    ) {
      return { state: "conflict" as const };
    }
    if (existing.state === "succeeded") {
      return { state: "succeeded" as const, result: existing.result };
    }
    if (existing.state === "failed" && existing.error) {
      return { state: "failed" as const, error: existing.error };
    }
    if (existing.state === "indeterminate") {
      return { state: "indeterminate" as const };
    }
    if (existing.state === "claimed" && existing.leaseExpiresAt <= now) {
      // The attempt that held this claim never reached `markSubmitted`, so the
      // operation cannot have been sent. Taking the claim over replaces the
      // token, which is what stops that earlier attempt from submitting later.
      await ctx.db.patch(existing._id, {
        attemptToken: args.attemptToken,
        leaseExpiresAt: now + CLAIM_LEASE_MS,
      });
      return { state: "claimed" as const };
    }
    return { state: "pending" as const };
  },
});

export const markSubmitted = mutation({
  args: {
    ledgerKey: v.string(),
    requestFingerprint: v.string(),
    attemptToken: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const now = Date.now();
    const operation = await ctx.db
      .query("operations")
      .withIndex("ledgerKey", (query) => query.eq("ledgerKey", args.ledgerKey))
      .unique();
    if (
      !operation ||
      operation.requestFingerprint !== args.requestFingerprint ||
      operation.state !== "claimed" ||
      operation.attemptToken !== args.attemptToken ||
      operation.leaseExpiresAt <= now
    ) {
      throw new Error("Operation claim is no longer available.");
    }
    await ctx.db.patch(operation._id, { state: "submitted" });
    return null;
  },
});

export const completeOperation = mutation({
  args: {
    ledgerKey: v.string(),
    requestFingerprint: v.string(),
    attemptToken: v.string(),
    terminal: v.union(
      v.object({ state: v.literal("succeeded"), result: v.any() }),
      v.object({ state: v.literal("failed"), error: errorData }),
      v.object({ state: v.literal("indeterminate") })
    ),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const operation = await ctx.db
      .query("operations")
      .withIndex("ledgerKey", (query) => query.eq("ledgerKey", args.ledgerKey))
      .unique();
    if (
      !operation ||
      operation.requestFingerprint !== args.requestFingerprint ||
      operation.attemptToken !== args.attemptToken
    ) {
      throw new Error("Operation claim was not found.");
    }
    if (operation.state !== "submitted") {
      if (
        operation.state === args.terminal.state &&
        (operation.state === "indeterminate" ||
          operation.state === "succeeded" ||
          operation.state === "failed")
      ) {
        return null;
      }
      throw new Error("Operation is not awaiting a terminal result.");
    }

    if (args.terminal.state === "succeeded") {
      await ctx.db.patch(operation._id, {
        state: "succeeded",
        result: args.terminal.result,
        error: undefined,
      });
    } else if (args.terminal.state === "failed") {
      await ctx.db.patch(operation._id, {
        state: "failed",
        result: undefined,
        error: args.terminal.error,
      });
    } else {
      await ctx.db.patch(operation._id, {
        state: "indeterminate",
        result: undefined,
        error: undefined,
      });
    }
    return null;
  },
});
