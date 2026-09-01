import { describe, expect, test } from "vitest";
import {
  AutumnSerializationError,
  toConvexSerializable,
} from "./serialization.js";

describe("Convex result serialization", () => {
  test("preserves nested Convex values", () => {
    const bytes = new Uint8Array([1, 2, 3]).buffer;

    expect(
      toConvexSerializable({
        allowed: true,
        balance: null,
        count: 2,
        customerId: "customer-1",
        items: [{ id: "item-1" }],
        bytes,
      })
    ).toEqual({
      allowed: true,
      balance: null,
      count: 2,
      customerId: "customer-1",
      items: [{ id: "item-1" }],
      bytes,
    });
  });

  test.each([
    new Response(),
    new Request("https://example.test"),
    new Headers(),
    new Date(),
    new Error("private provider error"),
  ])("rejects non-Convex result values", (value) => {
    expect(() => toConvexSerializable(value)).toThrow(AutumnSerializationError);
  });

  test("rejects cyclic result objects", () => {
    const result: Record<string, unknown> = {};
    result.self = result;

    expect(() => toConvexSerializable(result)).toThrow(
      AutumnSerializationError
    );
  });
});
