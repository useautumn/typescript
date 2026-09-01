import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

const state = v.union(
  v.literal("claimed"),
  v.literal("submitted"),
  v.literal("succeeded"),
  v.literal("failed"),
  v.literal("indeterminate")
);

export default defineSchema({
  operations: defineTable({
    ledgerKey: v.string(),
    operation: v.string(),
    requestFingerprint: v.string(),
    state,
    result: v.optional(v.any()),
    error: v.optional(
      v.object({
        code: v.string(),
        operation: v.string(),
        statusCode: v.optional(v.number()),
        message: v.string(),
      })
    ),
  }).index("ledgerKey", ["ledgerKey"]),
});
