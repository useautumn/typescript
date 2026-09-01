const KEY_FORMAT_VERSION = "1";
const OPERATION_ID_MAX_LENGTH = 256;

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

export async function deriveOperationKeys({
  operation,
  customerId,
  operationId,
  request,
}: {
  operation: string;
  customerId: string;
  operationId: string;
  request: unknown;
}): Promise<{
  ledgerKey: string;
  requestFingerprint: string;
  providerKey: string;
}> {
  validateOperationId(operation, operationId);
  const requestFingerprint = await digest(canonicalize(request));
  const namespace = [
    KEY_FORMAT_VERSION,
    operation,
    customerId,
    operationId,
  ].join("\0");
  const ledgerKey = await digest(`ledger\0${namespace}`);
  const providerDigest = await digest(
    ["provider", namespace, requestFingerprint].join("\0")
  );

  return {
    ledgerKey,
    requestFingerprint,
    providerKey: `autumn-${KEY_FORMAT_VERSION}-${providerDigest}`,
  };
}
