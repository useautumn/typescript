import { describe, expect, test } from "vitest";
import { deriveOperationKeys } from "./idempotency.js";

const base = {
  operation: "track",
  operationNamespace: "namespace-1",
  customerId: "customer-1",
  operationId: "operation-1",
  request: { featureId: "messages", customerId: "customer-1" },
};

describe("operation key derivation", () => {
  test("separates namespaces that share everything else", async () => {
    const first = await deriveOperationKeys(base);
    const second = await deriveOperationKeys({
      ...base,
      operationNamespace: "namespace-2",
    });

    expect(second.ledgerKey).not.toBe(first.ledgerKey);
    expect(second.providerKey).not.toBe(first.providerKey);
  });

  /**
   * Identity parts are joined before they are hashed, and neither the customer
   * ID nor the operation ID is a value this package chooses. Without a length
   * in front of each part, one of them can carry the separator and take over
   * the next part's position, which addresses another operation's entry.
   */
  test("no identity part can absorb the next one", async () => {
    const shifted = await deriveOperationKeys({
      ...base,
      customerId: "customer\0operation",
      operationId: "1",
    });
    const original = await deriveOperationKeys({
      ...base,
      customerId: "customer",
      operationId: "operation\u00001",
    });

    expect(shifted.ledgerKey).not.toBe(original.ledgerKey);
    expect(shifted.providerKey).not.toBe(original.providerKey);
  });
});
