import { describe, expect, test } from "vitest";
import { convexToJson, type Value } from "convex/values";
import { AutumnValidationError } from "./errors.js";
import {
  AutumnSerializationError,
  toConvexSerializable,
  validateJsonRequest,
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

class Payload {
  amount = 10n;
}

class Plain {
  label = "ok";
  count = 2;
}

describe("Autumn request validation", () => {
  test.each([
    ["a bare value", 1n],
    ["an array", [1n]],
    ["a plain object", { amount: 1n }],
    ["a nested plain object", { outer: { amount: 1n } }],
    ["a class instance", new Payload()],
    ["an array of class instances", [new Payload()]],
    ["a class instance behind a plain object", { payload: new Payload() }],
  ])("rejects a bigint in %s", (_description, value) => {
    expect(() => validateJsonRequest("track", value)).toThrow(
      AutumnValidationError
    );
  });

  /**
   * Every element of a bigint-element view is a bigint, so the SDK's
   * `JSON.stringify` of one always throws "Do not know how to serialize a
   * BigInt". That is decidable from the view's type alone, without reading a
   * single element.
   */
  test.each([
    ["BigInt64Array", new BigInt64Array([1n])],
    ["BigUint64Array", new BigUint64Array([1n])],
  ])("rejects a %s", (_description, value) => {
    expect(() => validateJsonRequest("track", { value })).toThrow(
      AutumnValidationError
    );
  });

  test.each([
    ["a Date", new Date("2026-01-01T00:00:00.000Z")],
    ["a class instance of ordinary fields", new Plain()],
    ["negative zero", 0 * -1],
    ["a null prototype object", Object.assign(Object.create(null), { a: 1 })],
    ["a large Uint8Array", new Uint8Array(100_000)],
  ])("accepts %s", (_description, value) => {
    expect(() => validateJsonRequest("track", { value })).not.toThrow();
  });

  /**
   * A typed array other than the two bigint-element ones is a leaf, because
   * walking one costs a pass over every element of a binary payload the direct
   * methods send whole. The residual is a non-finite element of a float view,
   * which the SDK encodes as `null` rather than refusing.
   */
  test("leaves a non-finite element of a float view to the SDK", () => {
    expect(() =>
      validateJsonRequest("track", { value: new Float64Array([1, Infinity]) })
    ).not.toThrow();
  });

  test("finds an unfaithful value in a cyclic request without overflowing", () => {
    const cyclic: Record<string, unknown> = { amount: 1n };
    cyclic.self = cyclic;

    expect(() => validateJsonRequest("track", cyclic)).toThrow(
      AutumnValidationError
    );
  });

  test.each([
    [
      "a plain object",
      () => {
        const cyclic: Record<string, unknown> = { label: "ok" };
        cyclic.self = cyclic;
        return cyclic;
      },
    ],
    [
      "a class instance",
      () => {
        class Node {
          self: unknown = undefined;
        }
        const node = new Node();
        node.self = node;
        return node;
      },
    ],
    [
      "an array",
      () => {
        const cyclic: unknown[] = [];
        cyclic.push(cyclic);
        return cyclic;
      },
    ],
  ])("terminates on a faithful cycle through %s", (_description, build) => {
    expect(() => validateJsonRequest("track", build())).not.toThrow();
  });

  test("visits a repeated sibling that is not a cycle", () => {
    const shared = { amount: 1n };

    expect(() =>
      validateJsonRequest("track", { first: shared, second: shared })
    ).toThrow(AutumnValidationError);
  });
});
