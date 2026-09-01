import { convexToJson, jsonToConvex, type Value } from "convex/values";

export class AutumnSerializationError extends Error {
  constructor() {
    super("The Autumn response cannot be serialized by Convex.");
    this.name = "AutumnSerializationError";
  }
}

/**
 * Round-trip a native SDK result through Convex's own value encoder.
 *
 * `convexToJson` is the encoder Convex applies at the outer action response
 * boundary, so it is the only complete source of the invalid-value grammar:
 * reserved `$` field names, control and non-ASCII field names, field names past
 * the maximum identifier length, unsupported object types, `undefined` and
 * out-of-range integers. Validating here rejects a bad result before it is
 * returned or written to the operation ledger, where a later Convex failure
 * would leave the operation stuck.
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
