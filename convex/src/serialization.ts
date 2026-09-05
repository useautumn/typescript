import { convexToJson, jsonToConvex, type Value } from "convex/values";
import { AutumnValidationError } from "./errors.js";

export class AutumnSerializationError extends Error {
  constructor() {
    super("The Autumn response cannot be serialized by Convex.");
    this.name = "AutumnSerializationError";
  }
}

/**
 * Whether a value the request cannot carry faithfully sits anywhere inside this
 * one.
 *
 * The SDK sends the request through `JSON.stringify`, which reads a class
 * instance exactly like a plain object. Inspecting only plain objects therefore
 * left an unsendable value hidden one class instance deep: the caller received
 * the SDK's raw `TypeError` instead of a named error of this package, and the
 * SDK's second result promise rejected with nothing attached to it. Every
 * object is walked for that reason.
 *
 * `seen` bounds the walk. Descending into arbitrary objects makes a request that
 * refers back to itself a stack overflow, and an array or plain object could
 * already do that before class instances were reached at all.
 *
 * The walk reads properties, which invokes getters. The SDK's own
 * `JSON.stringify` of the same request invokes them too, so sending the request
 * causes no side effect this check has not already caused.
 */
function containsUnfaithfulValue(value: unknown, seen: Set<object>): boolean {
  if (typeof value === "bigint") return true;
  if (typeof value === "number" && !Number.isFinite(value)) return true;
  if (typeof value !== "object" || value === null) return false;
  if (value instanceof ArrayBuffer) return true;
  // A typed array or `DataView` is a leaf. The SDK encodes a `Uint8Array` as
  // base64 and stringifies every other view as an index-keyed object, and
  // walking one costs a pass over every element of a binary payload the direct
  // methods pass whole. The two bigint-element views are the exception: every
  // element of one is a `bigint`, so `JSON.stringify` always refuses it with
  // "Do not know how to serialize a BigInt" (measured against autumn-js
  // 1.2.55), which the view's type alone decides without reading an element.
  // The residual is a non-finite element of a float view, which the SDK encodes
  // as `null` rather than refusing.
  if (ArrayBuffer.isView(value)) {
    return value instanceof BigInt64Array || value instanceof BigUint64Array;
  }
  if (seen.has(value)) return false;
  seen.add(value);
  const entries = Array.isArray(value) ? value : Object.values(value);
  return entries.some((entry) => containsUnfaithfulValue(entry, seen));
}

export function validateJsonRequest(operation: string, value: unknown): void {
  if (containsUnfaithfulValue(value, new Set())) {
    throw new AutumnValidationError(
      operation,
      "The Autumn request contains a value Autumn cannot receive faithfully."
    );
  }
}

/**
 * Round-trip a native SDK result through Convex's own value encoder.
 *
 * `convexToJson` is the encoder Convex applies at the outer action response
 * boundary, so it is the only complete source of the invalid-value grammar:
 * reserved `$` field names, control and non-ASCII field names, field names past
 * the maximum identifier length, unsupported object types, `undefined` and
 * out-of-range integers. Validating here turns a result Convex cannot encode
 * into a named error of this package, rather than an opaque failure at the
 * outer action boundary after the operation has already reached Autumn.
 *
 * `jsonToConvex` restores the Convex value itself, so callers keep `ArrayBuffer`
 * and `bigint` values instead of their `$bytes` and `$integer` transport
 * encoding. Convex embeds the offending value in its error messages, so those
 * messages are replaced with a fixed one that cannot leak a provider response.
 */
export function toConvexSerializable<T>(value: T): T {
  try {
    return jsonToConvex(convexToJson(value as Value)) as T;
  } catch {
    throw new AutumnSerializationError();
  }
}
