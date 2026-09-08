import { EdgeVM } from "@edge-runtime/vm";
import { describe, expect, test, vi } from "vitest";
import { convexToJson, type Value } from "convex/values";
import { AutumnValidationError } from "./errors.js";
import {
  AutumnSerializationError,
  snapshotJsonRequest,
  toConvexSerializable,
} from "./serialization.js";
import type { NativeRequestByOperation } from "./types.js";

const CONTROL_FIELD = `balance${String.fromCharCode(1)}`;
const NON_ASCII_FIELD = `balance${String.fromCharCode(233)}`;
const OVERLONG_FIELD = "b".repeat(1025);

/** The two platform limits the Convex encoder is documented as not applying. */
const UNENFORCED_LIMITS: Array<[string, () => Value]> = [
  ["a 20 MiB string", () => "a".repeat(20 * 1024 * 1024)],
  [
    "a 1000-deep object",
    () => {
      let deep: Value = null;
      for (let level = 0; level < 1000; level += 1) deep = { nested: deep };
      return deep;
    },
  ],
];

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

  /**
   * `toConvexSerializable` is documented as narrowing the encoder's per-value
   * grammar and not the platform's size and depth limits, and callers are told
   * to expect a large or deep result to fail at the outer action boundary
   * instead. That is a claim about the installed encoder rather than about this
   * package, so it is pinned against the encoder: were a later Convex release to
   * start rejecting either, the failure would move inside this package and the
   * documented division would be wrong.
   */
  test.each(UNENFORCED_LIMITS)(
    "neither the encoder nor this package rejects %s",
    (_name, build) => {
      const value = build();

      expect(() => convexToJson(value)).not.toThrow();
      expect(() => toConvexSerializable(value)).not.toThrow();
    }
  );

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

type TrackRequest = NativeRequestByOperation["track"];
type AttachRequest = NativeRequestByOperation["billing.attach"];

function trackRequest(properties: Record<string, unknown>): TrackRequest {
  return {
    customerId: "customer-1",
    featureId: "messages",
    properties,
  };
}

function snapshotTrack(properties: Record<string, unknown>) {
  return snapshotJsonRequest("track", trackRequest(properties));
}

function invalidTrack(value: unknown): () => unknown {
  return () => snapshotTrack({ value });
}

describe("Autumn request snapshots", () => {
  test("materializes the JSON value grammar", () => {
    const array: unknown[] = [1];
    array.length = 4;
    array[2] = undefined;
    array[3] = "done";
    const source = {
      null: null,
      boolean: true,
      string: "message",
      number: 2,
      negativeZero: 0 * -1,
      omitted: undefined,
      array,
      nested: { kept: true, omitted: undefined },
    };

    const snapshot = snapshotTrack(source);

    expect(snapshot.properties).toEqual({
      null: null,
      boolean: true,
      string: "message",
      number: 2,
      negativeZero: 0,
      array: [1, null, null, "done"],
      nested: { kept: true },
    });
    expect(Object.is(snapshot.properties!.negativeZero, -0)).toBe(false);
  });

  test.each(["2", Number.POSITIVE_INFINITY, 1.5, -1, 2 ** 32])(
    "rejects the noncanonical array length %s",
    (length) => {
      const values = new Proxy([1, 2], {
        get(target, key, receiver) {
          if (key === "length") return length;
          return Reflect.get(target, key, receiver);
        },
        getOwnPropertyDescriptor(target, key) {
          if (key === "length") {
            return {
              configurable: false,
              enumerable: false,
              writable: true,
              value: length,
            };
          }
          return Reflect.getOwnPropertyDescriptor(target, key);
        },
      });

      expect(invalidTrack(values)).toThrow(AutumnValidationError);
    }
  );

  test("rejects an array whose length changes while it is materialized", () => {
    let reads = 0;
    const values = new Proxy([1, 2], {
      get(target, key, receiver) {
        if (key === "length") {
          reads += 1;
          return reads === 1 ? 2 : 1.5;
        }
        return Reflect.get(target, key, receiver);
      },
    });

    expect(invalidTrack(values)).toThrow(AutumnValidationError);
    expect(reads).toBe(2);
  });

  test.each([
    ["bigint", 1n],
    ["NaN", Number.NaN],
    ["positive infinity", Number.POSITIVE_INFINITY],
    ["negative infinity", Number.NEGATIVE_INFINITY],
    ["a function", () => undefined],
    ["a symbol", Symbol("value")],
    ["an ArrayBuffer", new ArrayBuffer(4)],
    ["a DataView", new DataView(new ArrayBuffer(4))],
    ["another typed array", new Int16Array([1])],
    ["a Map", new Map([["key", "value"]])],
    ["a Set", new Set(["value"])],
    ["a RegExp", /value/],
    ["a Promise", Promise.resolve("value")],
    ["a boxed number", new Number(1)],
    ["an invalid Date", new Date(Number.NaN)],
  ])("rejects %s", (_description, value) => {
    expect(invalidTrack(value)).toThrow(AutumnValidationError);
  });

  test("rejects class instances even when their fields are JSON data", () => {
    class Payload {
      label = "ok";
      count = 2;
    }

    expect(invalidTrack(new Payload())).toThrow(AutumnValidationError);
  });

  test.each([
    [
      "a Date subclass",
      new (class ExtendedDate extends Date {})("2026-01-01T00:00:00.000Z"),
    ],
    ["a Uint8Array subclass", new (class Bytes extends Uint8Array {})([1, 2])],
  ])("rejects %s", (_description, value) => {
    expect(invalidTrack(value)).toThrow(AutumnValidationError);
  });

  test("rejects a Proxy around Uint8Array", () => {
    const bytes = new Proxy(new Uint8Array([1, 2, 3]), {});

    expect(invalidTrack(bytes)).toThrow(AutumnValidationError);
  });

  test("keeps a byte Proxy on the object path when its first prototype is plain", () => {
    const bytes = new Proxy(new Uint8Array([1, 2, 3]), {
      getPrototypeOf() {
        return Object.prototype;
      },
    });

    expect(snapshotTrack({ bytes }).properties).toEqual({
      bytes: { 0: 1, 1: 2, 2: 3 },
    });
  });

  test("rejects Uint8Array backed by shared memory", () => {
    const bytes = new Uint8Array(new SharedArrayBuffer(4));

    expect(invalidTrack(bytes)).toThrow(AutumnValidationError);
  });

  test("accepts direct Uint8Array values from an Edge Runtime realm", () => {
    const edge = new EdgeVM();
    const encoded = edge.evaluate<Uint8Array>(
      'new TextEncoder().encode("value")'
    );
    Object.defineProperty(edge.context, "encoded", { value: encoded });
    expect(edge.evaluate("encoded instanceof Uint8Array")).toBe(true);
    expect(
      edge.evaluate("Object.getPrototypeOf(encoded) === Uint8Array.prototype")
    ).toBe(false);

    const foreignBytes = edge.evaluate<Uint8Array>(
      "new Uint8Array([118, 97, 108, 117, 101])"
    );
    expect(Object.getPrototypeOf(foreignBytes)).not.toBe(Uint8Array.prototype);
    expect(snapshotTrack({ bytes: foreignBytes }).properties).toEqual({
      bytes: "dmFsdWU=",
    });
  });

  test("normalizes Date and Uint8Array only below registered free records", () => {
    const at = new Date("2026-01-01T00:00:00.000Z");
    const bytes = new Uint8Array([1, 2, 3]);

    expect(snapshotTrack({ at, bytes }).properties).toEqual({
      at: "2026-01-01T00:00:00.000Z",
      bytes: "AQID",
    });

    const strict = {
      customerId: "customer-1",
      planId: "pro",
      successUrl: { properties: { at } },
    } as unknown as AttachRequest;
    expect(() => snapshotJsonRequest("billing.attach", strict)).toThrow(
      AutumnValidationError
    );
  });

  test("does not open policy transitions for nested names", () => {
    const request = {
      customerId: "customer-1",
      planId: "pro",
      invoiceMode: {
        enabled: true,
        checkoutSessionParams: {
          at: new Date("2026-01-01T00:00:00.000Z"),
        },
      },
    } as unknown as AttachRequest;

    expect(() => snapshotJsonRequest("billing.attach", request)).toThrow(
      AutumnValidationError
    );
  });

  test.each(["free-first", "strict-first"])(
    "rejects a Date shared across policy domains in %s order",
    (order) => {
      const shared = new Date("2026-01-01T00:00:00.000Z");
      const fields =
        order === "free-first"
          ? { checkoutSessionParams: { at: shared }, successUrl: shared }
          : { successUrl: shared, checkoutSessionParams: { at: shared } };
      const request = {
        customerId: "customer-1",
        planId: "pro",
        ...fields,
      } as unknown as AttachRequest;

      expect(() => snapshotJsonRequest("billing.attach", request)).toThrow(
        AutumnValidationError
      );
    }
  );

  test.each(["free-first", "strict-first"])(
    "rejects bytes shared across policy domains in %s order",
    (order) => {
      const shared = new Uint8Array([1, 2, 3]);
      const fields =
        order === "free-first"
          ? { checkoutSessionParams: { bytes: shared }, successUrl: shared }
          : { successUrl: shared, checkoutSessionParams: { bytes: shared } };
      const request = {
        customerId: "customer-1",
        planId: "pro",
        ...fields,
      } as unknown as AttachRequest;

      expect(() => snapshotJsonRequest("billing.attach", request)).toThrow(
        AutumnValidationError
      );
    }
  );

  test.each(["free-first", "strict-first"])(
    "rejects a container shared across policy domains in %s order",
    (order) => {
      const shared = { enabled: true };
      const fields =
        order === "free-first"
          ? { checkoutSessionParams: { options: shared }, invoiceMode: shared }
          : { invoiceMode: shared, checkoutSessionParams: { options: shared } };
      const request = {
        customerId: "customer-1",
        planId: "pro",
        ...fields,
      } as AttachRequest;

      expect(() => snapshotJsonRequest("billing.attach", request)).toThrow(
        AutumnValidationError
      );
    }
  );

  test("reuses a shared value inside one policy domain after one read", () => {
    let reads = 0;
    const shared = {
      get label() {
        reads += 1;
        return "ok";
      },
    };

    const snapshot = snapshotTrack({ first: shared, second: shared });

    expect(reads).toBe(1);
    expect(snapshot.properties!.first).toBe(snapshot.properties!.second);
  });

  test.each([
    () => {
      const value: Record<string, unknown> = {};
      value.self = value;
      return value;
    },
    () => {
      const value: unknown[] = [];
      value.push(value);
      return value;
    },
  ])("rejects an active cycle", (build) => {
    expect(invalidTrack(build())).toThrow(AutumnValidationError);
  });

  test("evaluates a selected payload getter once", () => {
    let reads = 0;
    const properties = Object.create(null) as Record<string, unknown>;
    Object.defineProperty(properties, "value", {
      enumerable: true,
      get() {
        reads += 1;
        return { nested: true };
      },
    });

    expect(snapshotTrack(properties).properties).toEqual({
      value: { nested: true },
    });
    expect(reads).toBe(1);
  });

  test("detaches every reachable snapshot node from mutable caller data", () => {
    const at = new Date("2026-01-01T00:00:00.000Z");
    const bytes = new Uint8Array([1, 2, 3]);
    const nested = { label: "before" };
    const items = [nested];
    const properties = { at, bytes, items };

    const snapshot = snapshotTrack(properties);
    at.setUTCFullYear(2030);
    bytes[0] = 9;
    nested.label = "after";
    items.push({ label: "later" });
    properties.items = [];

    expect(snapshot.properties).toEqual({
      at: "2026-01-01T00:00:00.000Z",
      bytes: "AQID",
      items: [{ label: "before" }],
    });
  });

  test("uses intrinsic Date and byte behavior without caller hooks", () => {
    const at = new Date("2026-01-01T00:00:00.000Z");
    const dateHook = vi.fn(() => "wrong");
    Object.defineProperty(at, "toJSON", { enumerable: true, value: dateHook });
    const bytes = new Uint8Array([1, 2, 3]);
    const iterator = vi.fn(() => {
      throw new Error("iterator must not run");
    });
    const species = vi.fn(() => {
      throw new Error("species must not run");
    });
    const conversion = vi.fn(() => {
      throw new Error("conversion must not run");
    });
    const callerConstructor = {};
    Object.defineProperty(callerConstructor, Symbol.species, { get: species });
    Object.defineProperties(bytes, {
      constructor: { value: callerConstructor },
      [Symbol.iterator]: { value: iterator },
      valueOf: { value: conversion },
      toString: { value: conversion },
      extra: { enumerable: true, value: "ignored" },
    });

    expect(snapshotTrack({ at, bytes }).properties).toEqual({
      at: "2026-01-01T00:00:00.000Z",
      bytes: "AQID",
    });
    expect(dateHook).not.toHaveBeenCalled();
    expect(iterator).not.toHaveBeenCalled();
    expect(species).not.toHaveBeenCalled();
    expect(conversion).not.toHaveBeenCalled();
  });

  test("does not read a caller-owned byte constructor", () => {
    const bytes = new Uint8Array([1, 2, 3]);
    const constructor = vi.fn(() => {
      throw new Error("constructor must not run");
    });
    Object.defineProperty(bytes, "constructor", { get: constructor });

    const snapshot = snapshotTrack({ bytes });
    bytes[0] = 9;

    expect(snapshot.properties!.bytes).toBe("AQID");
    expect(constructor).not.toHaveBeenCalled();
  });

  test("encodes large byte values without a full argument spread", () => {
    const bytes = new Uint8Array(200_000);
    bytes[0] = 1;
    bytes[bytes.length - 1] = 4;

    expect(snapshotTrack({ bytes }).properties!.bytes).toBe(
      Buffer.from(bytes).toString("base64")
    );
  });

  test("creates null-prototype records and controlled data properties", () => {
    const nested = Object.create(null) as Record<string, unknown>;
    Object.defineProperty(nested, "__proto__", {
      enumerable: true,
      get: () => ({ safe: true }),
    });

    const snapshot = snapshotTrack({ nested });
    const properties = snapshot.properties! as Record<string, unknown>;
    const copied = properties.nested as Record<string, unknown>;

    expect(Object.getPrototypeOf(snapshot)).toBeNull();
    expect(Object.getPrototypeOf(properties)).toBeNull();
    expect(Object.getPrototypeOf(copied)).toBeNull();
    expect(copied.__proto__).toEqual({ safe: true });
    expect(Object.getOwnPropertyDescriptor(copied, "__proto__")).toMatchObject({
      enumerable: true,
      writable: true,
      value: { safe: true },
    });
  });

  test("does not inspect ordinary symbol fields or extra array properties", () => {
    const symbolGetter = vi.fn(() => {
      throw new Error("symbol getter must not run");
    });
    const extraGetter = vi.fn(() => {
      throw new Error("array getter must not run");
    });
    const nested = { kept: true };
    Object.defineProperty(nested, Symbol("ignored"), { get: symbolGetter });
    const values = [1, 2];
    Object.defineProperty(values, "extra", { get: extraGetter });

    expect(snapshotTrack({ nested, values }).properties).toEqual({
      nested: { kept: true },
      values: [1, 2],
    });
    expect(symbolGetter).not.toHaveBeenCalled();
    expect(extraGetter).not.toHaveBeenCalled();
  });

  test("returns a fixed validation error without source details", () => {
    const secret = "private-payload-value";
    const properties = new Proxy(
      {},
      {
        ownKeys() {
          throw new Error(`${secret}-trap`);
        },
      }
    );

    const caught = (() => {
      try {
        snapshotTrack(properties);
        return undefined;
      } catch (error) {
        return error;
      }
    })();

    expect(caught).toBeInstanceOf(AutumnValidationError);
    expect(caught).toMatchObject({
      message:
        "The Autumn request contains a value Autumn cannot receive faithfully.",
    });
    expect((caught as Error).message).not.toContain(secret);
    expect((caught as Error & { cause?: unknown }).cause).toBeUndefined();
  });
});
