import { describe, expect, test } from "vitest";
import { AutumnConfigurationError, AutumnValidationError } from "./errors.js";
import { deriveProviderKey } from "./idempotency.js";

/** The byte the canonical identity joins its parts with. */
const SEPARATOR = String.fromCharCode(0);

const base = {
  operation: "track",
  operationNamespace: "namespace-1",
  customerId: "customer-1",
  operationId: "operation-1",
};

describe("provider key derivation", () => {
  test("repeats the key for the same operation identity", async () => {
    expect(await deriveProviderKey(base)).toBe(await deriveProviderKey(base));
    expect(await deriveProviderKey(base)).toMatch(/^autumn-2-[\w-]+$/);
  });

  test.each([
    ["namespace", { operationNamespace: "namespace-2" }],
    ["customer", { customerId: "customer-2" }],
    ["operation", { operation: "balances.update" }],
    ["operation ID", { operationId: "operation-2" }],
  ])("separates keys that differ only in the %s", async (_name, difference) => {
    expect(await deriveProviderKey({ ...base, ...difference })).not.toBe(
      await deriveProviderKey(base)
    );
  });

  /**
   * The limits are inclusive, and a caller cannot see where they sit. An
   * identifier of exactly the maximum length is a key this package has already
   * accepted, so a boundary that moved inward by one would refuse the retry of a
   * mutation under the key its first attempt used: the caller would have to
   * choose between a new key, which is a second mutation, and no retry at all.
   */
  test.each([
    ["a namespace", { operationNamespace: "n".repeat(256) }],
    ["an operation ID", { operationId: "o".repeat(256) }],
  ])("accepts %s of exactly the maximum length", async (_name, atLimit) => {
    await expect(deriveProviderKey({ ...base, ...atLimit })).resolves.toMatch(
      /^autumn-2-[\w-]+$/
    );
  });

  /**
   * Autumn scopes a claimed key to the organization and environment only, so a
   * key two customers share is claimed by whichever of them arrives first. The
   * second is refused for the duplicate window, and this package reports an
   * indeterminate outcome for a mutation that certainly never ran. Operation IDs
   * that are unique per customer rather than globally are the ordinary case: an
   * invoice number, a period label, a request ID from a client.
   *
   * The scoping is Autumn's server-side key builder, read on 2026-09-05: it
   * composes its storage key from the organization, the environment and the
   * hashed key, and the customer appears in none of the three.
   */
  test("keeps two customers off each other's key", async () => {
    const shared = { ...base, operationId: "monthly-reset-2026-09" };

    expect(
      await deriveProviderKey({ ...shared, customerId: "customer-a" })
    ).not.toBe(
      await deriveProviderKey({ ...shared, customerId: "customer-b" })
    );
  });

  test.each(["\ud800", "\udc00"])(
    "rejects malformed customer ID Unicode %j",
    async (customerId) => {
      await expect(
        deriveProviderKey({ ...base, customerId })
      ).rejects.toBeInstanceOf(AutumnValidationError);
    }
  );

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
        customerId: "customer-😀",
        operationId: "operation-😀",
      })
    ).resolves.toMatch(/^autumn-2-[\w-]+$/);
  });

  test("keeps no identity part readable in the key", async () => {
    const key = await deriveProviderKey(base);

    for (const part of Object.values(base)) {
      expect(key).not.toContain(part);
    }
  });

  /**
   * Identity parts are joined before they are hashed. The namespace is an
   * operator input, the customer is trusted but otherwise arbitrary, and the
   * operation ID comes from the caller, so any of them can carry the separator.
   * Without a length in front of each part it would take over the next part's
   * position and address another operation at Autumn. Each case pairs two
   * identities whose parts concatenate to the same bytes once the lengths are
   * dropped, so one key for both would mean the lengths had stopped carrying.
   */
  test.each([
    [
      "namespace into the customer",
      {
        operationNamespace: `namespace${SEPARATOR}customer`,
        customerId: "1",
      },
      {
        operationNamespace: "namespace",
        customerId: `customer${SEPARATOR}1`,
      },
    ],
    [
      "customer into the operation",
      { customerId: `customer${SEPARATOR}track`, operation: "operation" },
      { customerId: "customer", operation: `track${SEPARATOR}operation` },
    ],
    [
      "operation into the operation ID",
      { operation: `track${SEPARATOR}operation`, operationId: "1" },
      { operation: "track", operationId: `operation${SEPARATOR}1` },
    ],
  ])("keeps the %s from absorbing it", async (_name, shifted, original) => {
    expect(await deriveProviderKey({ ...base, ...shifted })).not.toBe(
      await deriveProviderKey({ ...base, ...original })
    );
  });
});
