import { describe, expect, test } from "vitest";
import { convexToJson, type Value } from "convex/values";
import {
  AutumnSerializationError,
  toConvexSerializable,
} from "./serialization.js";

const CONTROL_FIELD = `balance${String.fromCharCode(1)}`;
const NON_ASCII_FIELD = `balance${String.fromCharCode(233)}`;
const OVERLONG_FIELD = "b".repeat(1025);

const invalidFieldNames: Array<[string, string]> = [
  ["a reserved $ prefix", "$balance"],
  ["a control character", CONTROL_FIELD],
  ["a non-ASCII character", NON_ASCII_FIELD],
  ["more than the maximum length", OVERLONG_FIELD],
];

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

  test.each(invalidFieldNames)(
    "rejects a field name with %s",
    (_description, field) => {
      expect(() => toConvexSerializable({ [field]: 1 })).toThrow(
        AutumnSerializationError
      );
      expect(() =>
        toConvexSerializable({ balances: [{ [field]: 1 }] })
      ).toThrow(AutumnSerializationError);
    }
  );

  test.each(invalidFieldNames)(
    "matches the Convex encoder on a field name with %s",
    (_description, field) => {
      expect(() => convexToJson({ [field]: 1 })).toThrow();
      expect(() => convexToJson({ balances: [{ [field]: 1 }] })).toThrow();
    }
  );

  test("never repeats the Convex encoder message", () => {
    const caught = (() => {
      try {
        toConvexSerializable({
          secret: "private provider body",
          $balance: 1,
        });
        return undefined;
      } catch (error) {
        return error;
      }
    })();

    expect(caught).toBeInstanceOf(AutumnSerializationError);
    expect((caught as Error).message).toBe(
      "The Autumn response cannot be serialized by Convex."
    );
    expect((caught as Error).message).not.toContain("private provider body");
    expect((caught as Error).message).not.toContain("$balance");
  });

  test("returns Convex values rather than their transport encoding", () => {
    const result = toConvexSerializable({
      bytes: new Uint8Array([4, 5]).buffer,
      count: 9007199254740993n,
    });

    expect(result.bytes).toBeInstanceOf(ArrayBuffer);
    expect(new Uint8Array(result.bytes)).toEqual(new Uint8Array([4, 5]));
    expect(result.count).toBe(9007199254740993n);
    expect(convexToJson(result)).toEqual({
      bytes: { $bytes: "BAU=" },
      count: { $integer: "AQAAAAAAIAA=" },
    });
  });

  test("returns a value the Convex response boundary re-encodes unchanged", () => {
    const native = {
      allowed: true,
      customerId: "customer-1",
      balance: { balance: 4, unlimited: false },
      dropped: undefined,
    };

    expect(convexToJson(toConvexSerializable(native) as Value)).toEqual(
      convexToJson(native as Value)
    );
  });
});
