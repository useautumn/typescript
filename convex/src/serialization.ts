export class AutumnSerializationError extends Error {
  constructor() {
    super("The Autumn response cannot be serialized by Convex.");
    this.name = "AutumnSerializationError";
  }
}

export function toConvexSerializable(value: unknown): unknown {
  return clone(value, new Set());
}

function clone(value: unknown, seen: Set<object>): unknown {
  if (
    value === null ||
    typeof value === "string" ||
    typeof value === "boolean" ||
    typeof value === "bigint"
  ) {
    return value;
  }
  if (typeof value === "number") {
    if (!Number.isFinite(value)) throw new AutumnSerializationError();
    return value;
  }
  if (typeof value === "undefined") return undefined;
  if (typeof value !== "object") throw new AutumnSerializationError();
  if (
    value instanceof Response ||
    value instanceof Request ||
    value instanceof Headers ||
    value instanceof Blob ||
    value instanceof FormData ||
    value instanceof URL ||
    value instanceof Date ||
    value instanceof RegExp ||
    value instanceof Error ||
    ArrayBuffer.isView(value)
  ) {
    throw new AutumnSerializationError();
  }
  if (value instanceof ArrayBuffer) return value.slice(0);
  if (seen.has(value)) throw new AutumnSerializationError();
  seen.add(value);

  try {
    if (Array.isArray(value)) {
      return value.map((entry) => {
        const serialized = clone(entry, seen);
        if (serialized === undefined) throw new AutumnSerializationError();
        return serialized;
      });
    }

    const result: Record<string, unknown> = {};
    for (const [key, entry] of Object.entries(value)) {
      const serialized = clone(entry, seen);
      if (serialized !== undefined) result[key] = serialized;
    }
    return result;
  } finally {
    seen.delete(value);
  }
}
