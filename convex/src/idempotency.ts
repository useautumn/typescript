import { AutumnConfigurationError, AutumnValidationError } from "./errors.js";

/**
 * The identity composition this key format denotes.
 *
 * It travels in the readable prefix and inside the digest, so a key derived
 * under one composition can never be read as a key derived under another. Any
 * later change to which parts are hashed, or to the order they are hashed in,
 * bumps it. Version 1 hashed the namespace, the mutation action and the
 * operation ID; version 2 adds the trusted customer between the namespace and
 * the action.
 */
const KEY_FORMAT_VERSION = "2";
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
 * operator-chosen namespace with a customer ID, an action name and an operation
 * ID, and a plain separator would let one of them impersonate a prefix of the
 * next.
 */
function canonicalIdentity(parts: string[]): string {
  return parts.map((part) => `${part.length}\0${part}`).join("\0");
}

function isWellFormedUnicode(value: string): boolean {
  for (let index = 0; index < value.length; index += 1) {
    const codeUnit = value.charCodeAt(index);
    if (codeUnit >= 0xd800 && codeUnit <= 0xdbff) {
      if (index + 1 >= value.length) return false;
      const nextCodeUnit = value.charCodeAt(index + 1);
      if (nextCodeUnit < 0xdc00 || nextCodeUnit > 0xdfff) return false;
      index += 1;
    } else if (codeUnit >= 0xdc00 && codeUnit <= 0xdfff) {
      return false;
    }
  }
  return true;
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
  if (!isWellFormedUnicode(operationNamespace)) {
    throw new AutumnConfigurationError(
      "Autumn operationNamespace must contain well-formed Unicode."
    );
  }
}

/**
 * Check that a customer ID reaches the digest unchanged.
 *
 * `TextEncoder` replaces an unpaired surrogate with U+FFFD, so two customer IDs
 * differing only in one would collapse to a single identity. The customer is
 * what now keeps two tenants' operations apart, so it is checked for the reason
 * the namespace and the operation ID already are. Its length stays unbounded:
 * the value is trusted, it reaches the header only as part of the digest, and
 * both callers have already rejected an empty one.
 */
function validateCustomerId(operation: string, customerId: string): void {
  if (!isWellFormedUnicode(customerId)) {
    throw new AutumnValidationError(
      operation,
      `${operation} customerId must contain well-formed Unicode.`
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
    throw new AutumnValidationError(
      operation,
      `${operation} operationId must be between 1 and ${OPERATION_ID_MAX_LENGTH} characters.`
    );
  }
  if (!isWellFormedUnicode(operationId)) {
    throw new AutumnValidationError(
      operation,
      `${operation} operationId must contain well-formed Unicode.`
    );
  }
}

/**
 * Derive the provider idempotency key for one mutation.
 *
 * The key is the only duplicate suppression this package has, so it is derived
 * from operation identity alone: the namespace, the trusted customer, the
 * mutation action and the caller's operation ID. The namespace keeps tenants and
 * environments apart, the action name keeps one operation ID from meaning two
 * different mutations, and the customer keeps one operation ID from addressing
 * two customers' mutations.
 *
 * The customer has to be in here because Autumn scopes a claimed key to the
 * organization and environment only. A key exists to suppress the retry of one
 * operation, and a retry always carries the same customer, so two customers that
 * happen to choose the same operation ID are two operations rather than one:
 * without the customer the first claims the key and the second is refused for
 * the duplicate window, which this package can only report as an indeterminate
 * outcome for a mutation that never ran.
 *
 * The request payload stays out for the opposite reason. A retry that corrects
 * its arguments is still the same operation, and a payload in the key would give
 * it a new one, turning Autumn's duplicate rejection into a second mutation
 * nobody asked for.
 *
 * None of the inputs travels in readable form: the key is a digest of the
 * versioned canonical identity, and only the format version stays legible.
 */
export async function deriveProviderKey({
  operation,
  operationNamespace,
  customerId,
  operationId,
}: {
  operation: string;
  operationNamespace: string;
  customerId: string;
  operationId: string;
}): Promise<string> {
  validateOperationNamespace(operationNamespace);
  validateCustomerId(operation, customerId);
  validateOperationId(operation, operationId);
  const identity = await digest(
    canonicalIdentity([
      KEY_FORMAT_VERSION,
      operationNamespace,
      customerId,
      operation,
      operationId,
    ])
  );

  return `autumn-${KEY_FORMAT_VERSION}-${identity}`;
}
