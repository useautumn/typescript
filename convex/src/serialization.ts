import { convexToJson, jsonToConvex, type Value } from "convex/values";
import { AutumnValidationError } from "./errors.js";
import type {
  JsonValue,
  NativeOperation,
  NativeRequestByOperation,
  NativeRequestSnapshot,
} from "./types.js";

const REQUEST_VALIDATION_MESSAGE =
  "The Autumn request contains a value Autumn cannot receive faithfully.";
const BASE64_ALPHABET =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
const MAX_ARRAY_LENGTH = 2 ** 32 - 1;
const TYPED_ARRAY_PROTOTYPE = Object.getPrototypeOf(Uint8Array.prototype);
const TYPED_ARRAY_BUFFER_GETTER = Object.getOwnPropertyDescriptor(
  TYPED_ARRAY_PROTOTYPE,
  "buffer"
)?.get;
const TYPED_ARRAY_LENGTH_GETTER = Object.getOwnPropertyDescriptor(
  TYPED_ARRAY_PROTOTYPE,
  "length"
)?.get;
const TYPED_ARRAY_TAG_GETTER = Object.getOwnPropertyDescriptor(
  TYPED_ARRAY_PROTOTYPE,
  Symbol.toStringTag
)?.get;

type IsAny<T> = 0 extends 1 & T ? true : false;
type RootKey<Operation extends NativeOperation> = Extract<
  keyof NativeRequestByOperation[Operation],
  string
>;
type FreeRecordKey<Operation extends NativeOperation> = {
  [Key in RootKey<Operation>]: NonNullable<
    NativeRequestByOperation[Operation][Key]
  > extends Record<string, infer Value>
    ? IsAny<Value> extends true
      ? Key
      : never
    : never;
}[RootKey<Operation>];
type StringRecordKey<Operation extends NativeOperation> = {
  [Key in RootKey<Operation>]: NonNullable<
    NativeRequestByOperation[Operation][Key]
  > extends Record<string, infer Value>
    ? [Value] extends [string]
      ? [string] extends [Value]
        ? Key
        : never
      : never
    : never;
}[RootKey<Operation>];
type RequestPolicy<Operation extends NativeOperation> = {
  freeRecords: readonly (readonly [FreeRecordKey<Operation>])[];
  stringRecords: readonly (readonly [StringRecordKey<Operation>])[];
};
type RequestPolicies = {
  [Operation in NativeOperation]: RequestPolicy<Operation>;
};

const REQUEST_POLICIES = {
  check: { freeRecords: [["properties"]], stringRecords: [] },
  track: { freeRecords: [["properties"]], stringRecords: [] },
  "billing.previewAttach": {
    freeRecords: [["checkoutSessionParams"]],
    stringRecords: [["metadata"]],
  },
  "billing.attach": {
    freeRecords: [["checkoutSessionParams"]],
    stringRecords: [["metadata"]],
  },
  "billing.previewMultiAttach": {
    freeRecords: [["checkoutSessionParams"]],
    stringRecords: [],
  },
  "billing.multiAttach": {
    freeRecords: [["checkoutSessionParams"]],
    stringRecords: [],
  },
  "billing.previewUpdate": {
    freeRecords: [["subscriptionParams"]],
    stringRecords: [],
  },
  "billing.update": {
    freeRecords: [["subscriptionParams"]],
    stringRecords: [],
  },
  "billing.previewMultiUpdate": {
    freeRecords: [["subscriptionParams"]],
    stringRecords: [],
  },
  "billing.multiUpdate": {
    freeRecords: [["subscriptionParams"]],
    stringRecords: [],
  },
  "billing.setupPayment": {
    freeRecords: [["checkoutSessionParams"]],
    stringRecords: [["metadata"]],
  },
  "billing.portal": { freeRecords: [], stringRecords: [] },
  "customers.get": { freeRecords: [], stringRecords: [] },
  "customers.getOrCreate": {
    freeRecords: [["metadata"]],
    stringRecords: [],
  },
  "customers.update": { freeRecords: [["metadata"]], stringRecords: [] },
  "customers.delete": { freeRecords: [], stringRecords: [] },
  "entities.create": { freeRecords: [], stringRecords: [] },
  "entities.get": { freeRecords: [], stringRecords: [] },
  "entities.list": { freeRecords: [], stringRecords: [] },
  "entities.update": { freeRecords: [], stringRecords: [] },
  "entities.delete": { freeRecords: [], stringRecords: [] },
  "plans.get": { freeRecords: [], stringRecords: [] },
  "plans.list": { freeRecords: [], stringRecords: [] },
  "balances.update": { freeRecords: [], stringRecords: [] },
  "events.list": { freeRecords: [], stringRecords: [] },
  "events.aggregate": { freeRecords: [], stringRecords: [["filterBy"]] },
  "referrals.create": { freeRecords: [], stringRecords: [] },
  "referrals.redeem": { freeRecords: [], stringRecords: [] },
} satisfies RequestPolicies;

type PolicyDomain =
  | "root"
  | "strict"
  | "freeValue"
  | "freeRecord"
  | "stringRecord";
type MemoEntry =
  | { domain: PolicyDomain; state: "active" }
  | { domain: PolicyDomain; state: "complete"; value: JsonValue };
type RootPolicy = {
  freeRecords: ReadonlySet<string>;
  stringRecords: ReadonlySet<string>;
};

function defineDataProperty(
  target: Record<PropertyKey, JsonValue>,
  key: string,
  value: JsonValue
): void {
  Object.defineProperty(target, key, {
    configurable: true,
    enumerable: true,
    writable: true,
    value,
  });
}

function copyUint8Array(source: Uint8Array, length: number): Uint8Array {
  const copy = new Uint8Array(length);
  Uint8Array.prototype.set.call(copy, source);
  return copy;
}

function canonicalArrayLength(value: unknown): value is number {
  return (
    typeof value === "number" &&
    Number.isFinite(value) &&
    Number.isInteger(value) &&
    value >= 0 &&
    value <= MAX_ARRAY_LENGTH
  );
}

function captureArrayLength(source: unknown[]): number {
  const descriptor = Reflect.getOwnPropertyDescriptor(source, "length");
  if (
    !descriptor ||
    !("value" in descriptor) ||
    !canonicalArrayLength(descriptor.value)
  ) {
    throw new TypeError();
  }
  const length = Reflect.get(source, "length");
  if (length !== descriptor.value) throw new TypeError();
  return length;
}

function confirmArrayLength(source: unknown[], length: number): void {
  const descriptor = Reflect.getOwnPropertyDescriptor(source, "length");
  if (!descriptor || !("value" in descriptor) || descriptor.value !== length) {
    throw new TypeError();
  }
  if (Reflect.get(source, "length") !== length) throw new TypeError();
}

function directTypedArrayBytesPerElement(
  prototype: object | null
): number | undefined {
  if (!prototype) return undefined;
  const bytesPerElement = Reflect.getOwnPropertyDescriptor(
    prototype,
    "BYTES_PER_ELEMENT"
  );
  if (
    !bytesPerElement ||
    !("value" in bytesPerElement) ||
    typeof bytesPerElement.value !== "number" ||
    bytesPerElement.writable ||
    bytesPerElement.enumerable ||
    bytesPerElement.configurable
  ) {
    return undefined;
  }

  const typedArrayPrototype = Object.getPrototypeOf(prototype);
  if (!typedArrayPrototype) return undefined;
  const buffer = Reflect.getOwnPropertyDescriptor(
    typedArrayPrototype,
    "buffer"
  );
  const length = Reflect.getOwnPropertyDescriptor(
    typedArrayPrototype,
    "length"
  );
  const tag = Reflect.getOwnPropertyDescriptor(
    typedArrayPrototype,
    Symbol.toStringTag
  );
  if (
    typeof buffer?.get !== "function" ||
    typeof length?.get !== "function" ||
    typeof tag?.get !== "function"
  ) {
    return undefined;
  }
  return bytesPerElement.value;
}

function hasTypedArrayPrototypeShape(prototype: object | null): boolean {
  if (directTypedArrayBytesPerElement(prototype) !== undefined) return true;
  return (
    prototype !== null &&
    directTypedArrayBytesPerElement(Object.getPrototypeOf(prototype)) !==
      undefined
  );
}

function readUint8Array(
  source: object,
  prototype: object | null
): { buffer: ArrayBufferLike; length: number } | undefined {
  if (
    !TYPED_ARRAY_BUFFER_GETTER ||
    !TYPED_ARRAY_LENGTH_GETTER ||
    !TYPED_ARRAY_TAG_GETTER
  ) {
    throw new TypeError();
  }

  const tag = TYPED_ARRAY_TAG_GETTER.call(source) as unknown;
  if (tag !== "Uint8Array") {
    if (hasTypedArrayPrototypeShape(prototype)) throw new TypeError();
    return undefined;
  }
  if (directTypedArrayBytesPerElement(prototype) !== 1) throw new TypeError();

  return {
    buffer: TYPED_ARRAY_BUFFER_GETTER.call(source) as ArrayBufferLike,
    length: TYPED_ARRAY_LENGTH_GETTER.call(source) as number,
  };
}

function base64(bytes: Uint8Array): string {
  let encoded = "";
  for (let index = 0; index < bytes.length; index += 3) {
    const first = bytes[index]!;
    const second = bytes[index + 1];
    const third = bytes[index + 2];
    const combined = first * 65536 + (second ?? 0) * 256 + (third ?? 0);
    encoded += BASE64_ALPHABET[(combined >>> 18) & 63];
    encoded += BASE64_ALPHABET[(combined >>> 12) & 63];
    encoded +=
      second === undefined ? "=" : BASE64_ALPHABET[(combined >>> 6) & 63];
    encoded += third === undefined ? "=" : BASE64_ALPHABET[combined & 63];
  }
  return encoded;
}

function isSharedArrayBuffer(value: unknown): boolean {
  const arrayBufferByteLength = Object.getOwnPropertyDescriptor(
    ArrayBuffer.prototype,
    "byteLength"
  )?.get;
  if (!arrayBufferByteLength) throw new TypeError();
  try {
    arrayBufferByteLength.call(value);
    return false;
  } catch {
    if (typeof SharedArrayBuffer === "undefined") throw new TypeError();
    const sharedByteLength = Object.getOwnPropertyDescriptor(
      SharedArrayBuffer.prototype,
      "byteLength"
    )?.get;
    if (!sharedByteLength) throw new TypeError();
    sharedByteLength.call(value);
    return true;
  }
}

function isPlainRecord(value: object): boolean {
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function rootPolicy(operation: NativeOperation): RootPolicy {
  const policy = REQUEST_POLICIES[operation];
  return {
    freeRecords: new Set(policy.freeRecords.map(([key]) => key)),
    stringRecords: new Set(policy.stringRecords.map(([key]) => key)),
  };
}

function materialize(operation: NativeOperation, request: object): JsonValue {
  const memo = new WeakMap<object, MemoEntry>();
  const policy = rootPolicy(operation);

  function begin(source: object, domain: PolicyDomain): JsonValue | undefined {
    const previous = memo.get(source);
    if (!previous) {
      memo.set(source, { domain, state: "active" });
      return undefined;
    }
    if (previous.domain !== domain || previous.state === "active") {
      throw new TypeError();
    }
    return previous.value;
  }

  function complete(
    source: object,
    domain: PolicyDomain,
    value: JsonValue
  ): JsonValue {
    memo.set(source, { domain, state: "complete", value });
    return value;
  }

  function visitArray(source: unknown[], domain: PolicyDomain): JsonValue[] {
    const previous = begin(source, domain);
    if (previous !== undefined) return previous as JsonValue[];
    if (Object.getPrototypeOf(source) !== Array.prototype)
      throw new TypeError();

    const result: JsonValue[] = [];
    const length = captureArrayLength(source);
    for (let index = 0; index < length; index += 1) {
      if (!Object.prototype.hasOwnProperty.call(source, index)) {
        result.push(null);
        continue;
      }
      const value = visit(Reflect.get(source, index), domain);
      result.push(value === undefined ? null : value);
    }
    confirmArrayLength(source, length);
    return complete(source, domain, result) as JsonValue[];
  }

  function visitSdkRecord(
    source: object,
    domain: "freeRecord" | "stringRecord"
  ): JsonValue {
    const previous = begin(source, domain);
    if (previous !== undefined) return previous;
    if (!isPlainRecord(source)) throw new TypeError();

    const result = Object.create(null) as Record<PropertyKey, JsonValue>;
    for (const key of Reflect.ownKeys(source)) {
      if (key === "__proto__") continue;
      if (typeof key === "symbol") throw new TypeError();
      const raw = Reflect.get(source, key);
      if (raw === undefined) {
        if (domain === "stringRecord") throw new TypeError();
        continue;
      }
      const value = visit(
        raw,
        domain === "freeRecord" ? "freeValue" : "strict"
      );
      if (value !== undefined) defineDataProperty(result, key, value);
    }
    return complete(source, domain, result);
  }

  function visitRecord(source: object, domain: PolicyDomain): JsonValue {
    const previous = begin(source, domain);
    if (previous !== undefined) return previous;
    if (!isPlainRecord(source)) throw new TypeError();

    const result = Object.create(null) as Record<PropertyKey, JsonValue>;
    for (const key of Reflect.ownKeys(source)) {
      if (typeof key === "symbol") continue;
      const descriptor = Reflect.getOwnPropertyDescriptor(source, key);
      if (!descriptor || !descriptor.enumerable) throw new TypeError();
      const raw = Reflect.get(source, key);
      if (raw === undefined) continue;

      let value: JsonValue | undefined;
      if (
        domain === "root" &&
        policy.freeRecords.has(key) &&
        typeof raw === "object" &&
        raw !== null &&
        !Array.isArray(raw) &&
        isPlainRecord(raw)
      ) {
        value = visitSdkRecord(raw, "freeRecord");
      } else if (
        domain === "root" &&
        policy.stringRecords.has(key) &&
        typeof raw === "object" &&
        raw !== null &&
        !Array.isArray(raw) &&
        isPlainRecord(raw)
      ) {
        value = visitSdkRecord(raw, "stringRecord");
      } else {
        value = visit(raw, domain === "freeValue" ? "freeValue" : "strict");
      }
      if (value !== undefined) defineDataProperty(result, key, value);
    }
    return complete(source, domain, result);
  }

  function visit(value: unknown, domain: PolicyDomain): JsonValue | undefined {
    if (value === undefined) return undefined;
    if (
      value === null ||
      typeof value === "boolean" ||
      typeof value === "string"
    ) {
      return value;
    }
    if (typeof value === "number") {
      if (!Number.isFinite(value)) throw new TypeError();
      return Object.is(value, -0) ? 0 : value;
    }
    if (
      typeof value === "bigint" ||
      typeof value === "function" ||
      typeof value === "symbol"
    ) {
      throw new TypeError();
    }

    const source = value;
    const prototype = Object.getPrototypeOf(source);
    if (prototype === Date.prototype) {
      const previous = begin(source, domain);
      if (previous !== undefined) return previous;
      if (domain !== "freeValue") throw new TypeError();
      const time = Date.prototype.getTime.call(source);
      if (!Number.isFinite(time)) throw new TypeError();
      return complete(source, domain, new Date(time).toISOString());
    }
    const uint8Array = readUint8Array(source, prototype);
    if (uint8Array) {
      const previous = begin(source, domain);
      if (previous !== undefined) return previous;
      if (domain !== "freeValue") throw new TypeError();
      if (isSharedArrayBuffer(uint8Array.buffer)) throw new TypeError();
      const copy = copyUint8Array(source as Uint8Array, uint8Array.length);
      return complete(source, domain, base64(copy));
    }
    if (Array.isArray(source)) return visitArray(source, domain);
    return visitRecord(source, domain);
  }

  return visit(request, "root")!;
}

export function snapshotJsonRequest<Operation extends NativeOperation>(
  operation: Operation,
  request: NativeRequestByOperation[NoInfer<Operation>]
): NativeRequestSnapshot<NativeRequestByOperation[Operation]> {
  try {
    const snapshot = materialize(operation, request);
    if (JSON.stringify(snapshot) === undefined) throw new TypeError();
    return snapshot as NativeRequestSnapshot<
      NativeRequestByOperation[Operation]
    >;
  } catch {
    throw new AutumnValidationError(operation, REQUEST_VALIDATION_MESSAGE);
  }
}

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
 * boundary, and it is the source of the per-value grammar: reserved `$` field
 * names, control and non-ASCII field names, field names past the maximum
 * identifier length, unsupported object types, `undefined` and out-of-range
 * integers. Validating here turns a result carrying one of those into a named
 * error of this package, rather than an opaque failure at the outer action
 * boundary after the operation has already reached Autumn.
 *
 * It is not the whole grammar the platform applies. `convexToJson` enforces
 * neither the function-return size limit nor any nesting depth. A provider
 * response large or deep enough therefore still passes here and is rejected by
 * the platform at the outer action boundary, after the operation has reached
 * Autumn.
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
