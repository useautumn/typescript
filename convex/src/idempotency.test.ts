import { describe, expect, test } from "vitest";
import { AutumnConfigurationError, AutumnValidationError } from "./errors.js";
import { deriveProviderKey } from "./idempotency.js";

const base = {
  operation: "track",
  operationNamespace: "namespace-1",
  operationId: "operation-1",
};

describe("provider key derivation", () => {
  test("repeats the key for the same operation identity", async () => {
    expect(await deriveProviderKey(base)).toBe(await deriveProviderKey(base));
    expect(await deriveProviderKey(base)).toMatch(/^autumn-1-[\w-]+$/);
  });

  test.each([
    ["namespace", { operationNamespace: "namespace-2" }],
    ["operation", { operation: "balances.update" }],
    ["operation ID", { operationId: "operation-2" }],
  ])("separates keys that differ only in the %s", async (_name, difference) => {
    expect(await deriveProviderKey({ ...base, ...difference })).not.toBe(
      await deriveProviderKey(base)
    );
  });

  test.each(["\ud800", "\udc00"])(
    "rejects malformed operation ID Unicode %j",
    async (operationId) => {
      await expect(
        deriveProviderKey({ ...base, operationId })
      ).rejects.toBeInstanceOf(AutumnValidationError);
    }
  );

  test.each(["\ud800", "\udc00"])(
    "rejects malformed namespace Unicode %j",
    async (operationNamespace) => {
      await expect(
        deriveProviderKey({ ...base, operationNamespace })
      ).rejects.toBeInstanceOf(AutumnConfigurationError);
    }
  );

  test("accepts paired surrogate sequences", async () => {
    await expect(
      deriveProviderKey({
        ...base,
        operationNamespace: "namespace-😀",
        operationId: "operation-😀",
      })
    ).resolves.toMatch(/^autumn-1-[\w-]+$/);
  });

  test("keeps no identity part readable in the key", async () => {
    const key = await deriveProviderKey(base);

    for (const part of Object.values(base)) {
      expect(key).not.toContain(part);
    }
  });

  /**
   * Identity parts are joined before they are hashed, and the namespace is an
   * operator input while the operation ID comes from the caller. Without a
   * length in front of each part, either can carry the separator and take over
   * the next part's position, which addresses another operation at Autumn.
   */
  test("no identity part can absorb the next one", async () => {
    const shifted = await deriveProviderKey({
      ...base,
      operationNamespace: "namespace\0track",
      operation: "operation",
      operationId: "1",
    });
    const original = await deriveProviderKey({
      ...base,
      operationNamespace: "namespace",
      operation: "track",
      operationId: "operation\u00001",
    });

    expect(shifted).not.toBe(original);
  });
});
