import { v } from "convex/values";
import { mutation } from "./_generated/server.js";

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
  },
  returns: claimResult,
  handler: async (ctx, args) => {
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
    return { state: "pending" as const };
  },
});

export const markSubmitted = mutation({
  args: { ledgerKey: v.string(), requestFingerprint: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const operation = await ctx.db
      .query("operations")
      .withIndex("ledgerKey", (query) => query.eq("ledgerKey", args.ledgerKey))
      .unique();
    if (
      !operation ||
      operation.requestFingerprint !== args.requestFingerprint ||
      operation.state !== "claimed"
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
      operation.requestFingerprint !== args.requestFingerprint
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
