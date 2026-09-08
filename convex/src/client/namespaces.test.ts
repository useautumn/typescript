/// <reference types="vite/client" />

import { afterEach, describe, expect, test, vi } from "vitest";
import { defineSchema, makeFunctionReference } from "convex/server";
import type { InternalTrackArgs } from "../types.js";
import { initConvexTest, response } from "./setup.test.js";

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
 * the only thing keeping their operations apart at Autumn.
 */
describe("operation namespaces", () => {
  test("two namespaces derive two provider keys", async () => {
    const keys = captureKeys();
    const t = initConvexTest(defineSchema({}));
    const args = {
      customerId: CUSTOMER_ID,
      featureId: "messages",
      value: 1,
      operationId: OPERATION_ID,
    };

    await expect(t.action(trackTenantA, args)).resolves.toEqual({
      customerId: CUSTOMER_ID,
      value: 1,
      balance: null,
    });
    await expect(t.action(trackTenantB, args)).resolves.toEqual({
      customerId: CUSTOMER_ID,
      value: 1,
      balance: null,
    });

    // Each namespace sent its own operation, and neither can suppress the
    // other's at Autumn, because their keys differ.
    expect(keys).toHaveLength(2);
    expect(new Set(keys).size).toBe(2);
  });

  test("one namespace repeats its key instead of replaying a stored result", async () => {
    const keys = captureKeys();
    const t = initConvexTest(defineSchema({}));
    const args = {
      customerId: CUSTOMER_ID,
      featureId: "messages",
      value: 1,
      operationId: OPERATION_ID,
    };

    await t.action(trackTenantA, args);
    await t.action(trackTenantA, args);

    // The package stores nothing, so a second invocation is a second request.
    // Suppressing it is Autumn's job, and the key it needs for that is the one
    // both requests carry.
    expect(keys).toHaveLength(2);
    expect(new Set(keys).size).toBe(1);
  });

  test("a reused operation ID keeps its key when the payload changes", async () => {
    const keys = captureKeys();
    const t = initConvexTest(defineSchema({}));
    const base = {
      customerId: CUSTOMER_ID,
      featureId: "messages",
      operationId: OPERATION_ID,
    };

    await t.action(trackTenantA, { ...base, value: 1 });
    await t.action(trackTenantA, { ...base, value: 2 });

    // The payload is not part of the key. A caller that reuses an operation ID
    // with different arguments reaches Autumn's duplicate rejection rather than
    // a second, differently keyed mutation.
    expect(new Set(keys).size).toBe(1);
  });
});
