import { AutumnConfigurationError } from "./errors.js";

const KEY_FORMAT_VERSION = "1";
const OPERATION_ID_MAX_LENGTH = 256;
const OPERATION_NAMESPACE_MAX_LENGTH = 256;

function canonicalize(value: unknown): string {
  if (value === null) return "null";

  switch (typeof value) {
    case "string":
      return JSON.stringify(value);
    case "boolean":
      return value ? "true" : "false";
    case "number":
      if (!Number.isFinite(value)) {
        throw new TypeError("Operation arguments must contain finite numbers.");
      }
      return Object.is(value, -0) ? "0" : JSON.stringify(value);
    case "bigint":
      return `{"$bigint":${JSON.stringify(value.toString())}}`;
    case "undefined":
      return "undefined";
    case "object": {
      if (Array.isArray(value)) {
        return `[${value.map(canonicalize).join(",")}]`;
      }
      const entries = Object.entries(value as Record<string, unknown>)
        .filter(([, child]) => child !== undefined)
        .sort(([left], [right]) => (left < right ? -1 : left > right ? 1 : 0));
      return `{${entries
        .map(([key, child]) => `${JSON.stringify(key)}:${canonicalize(child)}`)
        .join(",")}}`;
    }
    default:
      throw new TypeError("Operation arguments must be serializable.");
  }
}

function base64Url(bytes: ArrayBuffer): string {
  let binary = "";
  for (const byte of new Uint8Array(bytes)) binary += String.fromCharCode(byte);
  return btoa(binary)
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replace(/=+$/, "");
}

async function digest(value: string): Promise<string> {
  return base64Url(
    await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value))
  );
}

/**
 * Join identity parts so that no part can be read as a different one.
 *
 * Every part carries its own length, so a value that contains the separator
 * cannot move the boundary between two parts. Operation identity mixes an
 * operator-chosen namespace with a customer ID and an operation ID, and a plain
 * separator would let one of them impersonate a prefix of the next.
 */
function canonicalIdentity(parts: string[]): string {
  return parts.map((part) => `${part.length}\0${part}`).join("\0");
}

export function validateOperationNamespace(operationNamespace: string): void {
  if (
    operationNamespace.length === 0 ||
    operationNamespace.length > OPERATION_NAMESPACE_MAX_LENGTH
  ) {
    throw new AutumnConfigurationError(
      `Autumn operationNamespace must be between 1 and ${OPERATION_NAMESPACE_MAX_LENGTH} characters.`
    );
  }
}

export function validateOperationId(
  operation: string,
  operationId: string
): void {
  if (
    operationId.length === 0 ||
    operationId.length > OPERATION_ID_MAX_LENGTH
  ) {
    throw new TypeError(
      `${operation} operationId must be between 1 and ${OPERATION_ID_MAX_LENGTH} characters.`
    );
  }
}

/**
 * Derive the durable operation identity for one call.
 *
 * The namespace is part of both the ledger key and the provider key, so two
 * clients that share one component instance address disjoint ledger entries and
 * disjoint provider operations. Neither it nor the customer ID nor the
 * operation ID reaches the ledger or the `Idempotency-Key` header in readable
 * form: both keys are digests of the versioned canonical inputs, and only the
 * format version stays legible.
 */
export async function deriveOperationKeys({
  operation,
  operationNamespace,
  customerId,
  operationId,
  request,
}: {
  operation: string;
  operationNamespace: string;
  customerId: string;
  operationId: string;
  request: unknown;
}): Promise<{
  ledgerKey: string;
  requestFingerprint: string;
  providerKey: string;
}> {
  validateOperationNamespace(operationNamespace);
  validateOperationId(operation, operationId);
  const requestFingerprint = await digest(canonicalize(request));
  const identity = canonicalIdentity([
    KEY_FORMAT_VERSION,
    operationNamespace,
    operation,
    customerId,
    operationId,
  ]);
  const ledgerKey = await digest(canonicalIdentity(["ledger", identity]));
  const providerDigest = await digest(
    canonicalIdentity(["provider", identity, requestFingerprint])
  );

  return {
    ledgerKey,
    requestFingerprint,
    providerKey: `autumn-${KEY_FORMAT_VERSION}-${providerDigest}`,
  };
}
