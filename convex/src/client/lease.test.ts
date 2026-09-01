/// <reference types="vite/client" />

import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { defineSchema, makeFunctionReference } from "convex/server";
import type { InternalTrackArgs } from "../types.js";
import { CLAIM_LEASE_MS } from "../component/lib.js";
import { deriveOperationKeys } from "../idempotency.js";
import { LEASE_CUSTOMER_ID, LEASE_NAMESPACE } from "./lease.fixture.js";
import { errorData, initConvexTest, response } from "./setup.test.js";

const track = makeFunctionReference<"action", InternalTrackArgs, unknown>(
  "lease.fixture:track"
);
const claimOperation = makeFunctionReference<
  "action",
  {
    ledgerKey: string;
    operation: string;
    requestFingerprint: string;
    attemptToken: string;
  },
  { state: string }
>("lease.fixture:claimOperation");
const markSubmitted = makeFunctionReference<
  "action",
  { ledgerKey: string; requestFingerprint: string; attemptToken: string },
  null
>("lease.fixture:markSubmitted");
const completeOperation = makeFunctionReference<
  "action",
  { ledgerKey: string; requestFingerprint: string; attemptToken: string },
  null
>("lease.fixture:completeOperation");

const OPERATION_ID = "lease-operation-id";
const TERMINATED_ATTEMPT = "attempt-that-never-returned";
const args = {
  customerId: LEASE_CUSTOMER_ID,
  featureId: "messages",
  value: 1,
  operationId: OPERATION_ID,
};

/**
 * The keys the generated `track` action derives for {@link args}. The request
 * it sends is the arguments without the two identity fields, plus the customer
 * the caller passed, so a drifting request shape shows up here as a claim the
 * action does not recognize.
 */
async function operationKeys() {
  return await deriveOperationKeys({
    operation: "track",
    operationNamespace: LEASE_NAMESPACE,
    customerId: LEASE_CUSTOMER_ID,
    operationId: OPERATION_ID,
    request: {
      featureId: args.featureId,
      value: args.value,
      customerId: LEASE_CUSTOMER_ID,
    },
  });
}

function trackFetcher() {
  const fetcher = vi.fn(async () =>
    response({ customer_id: LEASE_CUSTOMER_ID, value: 1, balance: null })
  );
  vi.stubGlobal("fetch", fetcher);
  return fetcher;
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

/**
 * A process can die after `claimOperation` commits and before `markSubmitted`
 * does. The operation was never sent then, but the ledger holds a claim, so a
 * lease decides how long that claim survives its attempt and an attempt token
 * decides which invocation may still submit it.
 */
describe("claim leases", () => {
  test("a claim left by a terminated attempt suppresses a new attempt", async () => {
    const fetcher = trackFetcher();
    const t = initConvexTest(defineSchema({}));
    const keys = await operationKeys();

    await t.action(claimOperation, {
      ledgerKey: keys.ledgerKey,
      operation: "track",
      requestFingerprint: keys.requestFingerprint,
      attemptToken: TERMINATED_ATTEMPT,
    });
    vi.setSystemTime(Date.now() + CLAIM_LEASE_MS - 1);

    const caught = await t.action(track, args).catch((error) => error);

    expect(errorData(caught)).toMatchObject({
      code: "AUTUMN_INDETERMINATE",
      operation: "track",
    });
    expect(fetcher).not.toHaveBeenCalled();
  });

  test("a new attempt reclaims the operation once the lease expires", async () => {
    const fetcher = trackFetcher();
    const t = initConvexTest(defineSchema({}));
    const keys = await operationKeys();

    await t.action(claimOperation, {
      ledgerKey: keys.ledgerKey,
      operation: "track",
      requestFingerprint: keys.requestFingerprint,
      attemptToken: TERMINATED_ATTEMPT,
    });
    vi.setSystemTime(Date.now() + CLAIM_LEASE_MS);

    await expect(t.action(track, args)).resolves.toMatchObject({ value: 1 });
    expect(fetcher).toHaveBeenCalledOnce();
  });

  test("the reclaimed attempt token stops the original one from submitting", async () => {
    trackFetcher();
    const t = initConvexTest(defineSchema({}));
    const keys = await operationKeys();
    const claim = {
      ledgerKey: keys.ledgerKey,
      operation: "track",
      requestFingerprint: keys.requestFingerprint,
    };

    await t.action(claimOperation, {
      ...claim,
      attemptToken: TERMINATED_ATTEMPT,
    });
    vi.setSystemTime(Date.now() + CLAIM_LEASE_MS);
    await expect(
      t.action(claimOperation, { ...claim, attemptToken: "attempt-2" })
    ).resolves.toEqual({ state: "claimed" });

    await expect(
      t.action(markSubmitted, {
        ledgerKey: keys.ledgerKey,
        requestFingerprint: keys.requestFingerprint,
        attemptToken: TERMINATED_ATTEMPT,
      })
    ).rejects.toThrow("Operation claim is no longer available.");
    await expect(
      t.action(markSubmitted, {
        ledgerKey: keys.ledgerKey,
        requestFingerprint: keys.requestFingerprint,
        attemptToken: "attempt-2",
      })
    ).resolves.toBeNull();
  });

  test("an attempt whose lease ran out cannot submit the operation", async () => {
    trackFetcher();
    const t = initConvexTest(defineSchema({}));
    const keys = await operationKeys();

    await t.action(claimOperation, {
      ledgerKey: keys.ledgerKey,
      operation: "track",
      requestFingerprint: keys.requestFingerprint,
      attemptToken: TERMINATED_ATTEMPT,
    });
    vi.setSystemTime(Date.now() + CLAIM_LEASE_MS);

    await expect(
      t.action(markSubmitted, {
        ledgerKey: keys.ledgerKey,
        requestFingerprint: keys.requestFingerprint,
        attemptToken: TERMINATED_ATTEMPT,
      })
    ).rejects.toThrow("Operation claim is no longer available.");
  });

  test("only the submitting attempt may record the terminal result", async () => {
    trackFetcher();
    const t = initConvexTest(defineSchema({}));
    const keys = await operationKeys();
    const attempt = {
      ledgerKey: keys.ledgerKey,
      requestFingerprint: keys.requestFingerprint,
      attemptToken: "attempt-1",
    };

    await t.action(claimOperation, { ...attempt, operation: "track" });
    await t.action(markSubmitted, attempt);

    await expect(
      t.action(completeOperation, { ...attempt, attemptToken: "attempt-2" })
    ).rejects.toThrow("Operation claim was not found.");
    await expect(t.action(completeOperation, attempt)).resolves.toBeNull();
  });

  test("only one of two racing attempts reclaims the operation", async () => {
    trackFetcher();
    const t = initConvexTest(defineSchema({}));
    const keys = await operationKeys();
    const claim = {
      ledgerKey: keys.ledgerKey,
      operation: "track",
      requestFingerprint: keys.requestFingerprint,
    };

    await t.action(claimOperation, {
      ...claim,
      attemptToken: TERMINATED_ATTEMPT,
    });
    vi.setSystemTime(Date.now() + CLAIM_LEASE_MS);

    const states = (
      await Promise.all([
        t.action(claimOperation, { ...claim, attemptToken: "attempt-2" }),
        t.action(claimOperation, { ...claim, attemptToken: "attempt-3" }),
      ])
    ).map(({ state }) => state);

    expect(states.filter((state) => state === "claimed")).toHaveLength(1);
    expect(states.filter((state) => state === "pending")).toHaveLength(1);
  });

  test("an invocation cannot send an operation that is already in flight", async () => {
    const t = initConvexTest(defineSchema({}));
    let concurrent: Promise<unknown> | undefined;
    const fetcher = vi.fn(async () => {
      // A second invocation arrives while this request is in flight. The
      // ledger is submitted by then, so nothing may send the operation again.
      concurrent ??= t.action(track, args).catch((error) => error);
      await concurrent;
      return response({
        customer_id: LEASE_CUSTOMER_ID,
        value: 1,
        balance: null,
      });
    });
    vi.stubGlobal("fetch", fetcher);

    await expect(t.action(track, args)).resolves.toMatchObject({ value: 1 });

    expect(errorData(await concurrent)).toMatchObject({
      code: "AUTUMN_INDETERMINATE",
      operation: "track",
    });
    expect(fetcher).toHaveBeenCalledOnce();
  });
});
