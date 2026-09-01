import { AutumnConfigurationError } from "./errors.js";

const KEY_FORMAT_VERSION = "1";
const OPERATION_ID_MAX_LENGTH = 256;
const OPERATION_NAMESPACE_MAX_LENGTH = 256;

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
 * operator-chosen namespace with an action name and operation ID, and a plain
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
 * Derive the provider idempotency key for one mutation.
 *
 * The key is the only duplicate suppression this package has, so it is derived
 * from operation identity alone: the namespace, the mutation action and the
 * caller's operation ID. The namespace keeps tenants and environments apart,
 * and the action name keeps one operation ID from meaning two different
 * mutations.
 *
 * The request payload is deliberately not part of the key. A caller that reuses
 * an operation ID with different arguments must reach the same key, so that
 * Autumn rejects the second request as a duplicate rather than performing a
 * second mutation nobody asked for.
 *
 * None of the inputs travels in readable form: the key is a digest of the
 * versioned canonical identity, and only the format version stays legible.
 */
export async function deriveProviderKey({
  operation,
  operationNamespace,
  operationId,
}: {
  operation: string;
  operationNamespace: string;
  operationId: string;
}): Promise<string> {
  validateOperationNamespace(operationNamespace);
  validateOperationId(operation, operationId);
  const identity = await digest(
    canonicalIdentity([
      KEY_FORMAT_VERSION,
      operationNamespace,
      operation,
      operationId,
    ])
  );

  return `autumn-${KEY_FORMAT_VERSION}-${identity}`;
}
