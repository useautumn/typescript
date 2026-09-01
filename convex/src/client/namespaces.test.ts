/// <reference types="vite/client" />

import { afterEach, describe, expect, test, vi } from "vitest";
import { defineSchema, makeFunctionReference } from "convex/server";
import type { InternalTrackArgs } from "../types.js";
import { errorData, initConvexTest, response } from "./setup.test.js";

const trackTenantA = makeFunctionReference<
  "action",
  InternalTrackArgs,
  unknown
>("namespaces.fixture:trackTenantA");
const trackTenantB = makeFunctionReference<
  "action",
  InternalTrackArgs,
  unknown
>("namespaces.fixture:trackTenantB");

const CUSTOMER_ID = "customer-1";
const OPERATION_ID = "shared-operation-id";

function trackResponse(value: number) {
  return { customer_id: CUSTOMER_ID, value, balance: null };
}

function captureKeys() {
  const keys: string[] = [];
  vi.stubGlobal("fetch", async (input: RequestInfo | URL) => {
    const request = new Request(input);
    keys.push(request.headers.get("idempotency-key")!);
    const value = Number(
      (JSON.parse(await request.clone().text()) as { value: number }).value
    );
    return response(trackResponse(value));
  });
  return keys;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

/**
 * Two clients addressing the same installed component. Everything they share
 * (customer, operation, operation ID) is identical here, so the namespace is
 * the only thing keeping their operations apart.
 */
describe("operation namespaces on one component ledger", () => {
  test("neither namespace replays the other's terminal result", async () => {
    const keys = captureKeys();
    const t = initConvexTest(defineSchema({}));
    const args = {
      customerId: CUSTOMER_ID,
      featureId: "messages",
      value: 1,
      operationId: OPERATION_ID,
    };

    const firstA = await t.action(trackTenantA, args);
    const firstB = await t.action(trackTenantB, args);
    const replayA = await t.action(trackTenantA, args);
    const replayB = await t.action(trackTenantB, args);

    expect(firstA).toEqual({
      customerId: CUSTOMER_ID,
      value: 1,
      balance: null,
    });
    expect(firstB).toEqual(firstA);
    expect(replayA).toEqual(firstA);
    expect(replayB).toEqual(firstA);
    // Two dispatches for four invocations: each namespace sent its own
    // operation once and then replayed only its own stored result.
    expect(keys).toHaveLength(2);
    expect(new Set(keys).size).toBe(2);
  });

  test("neither namespace reports a conflict against the other", async () => {
    captureKeys();
    const t = initConvexTest(defineSchema({}));
    const base = {
      customerId: CUSTOMER_ID,
      featureId: "messages",
      operationId: OPERATION_ID,
    };

    await t.action(trackTenantA, { ...base, value: 1 });
    await expect(
      t.action(trackTenantB, { ...base, value: 2 })
    ).resolves.toMatchObject({ value: 2 });

    const conflict = await t
      .action(trackTenantA, { ...base, value: 2 })
      .catch((caught) => caught);

    expect(errorData(conflict).code).toBe("AUTUMN_OPERATION_CONFLICT");
  });
});
