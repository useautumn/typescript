/// <reference types="vite/client" />

import { afterEach, describe, expect, test, vi } from "vitest";
import { defineSchema, makeFunctionReference } from "convex/server";
import type { CheckArgs, InternalTrackArgs } from "../types.js";
import { errorData, initConvexTest, response } from "./setup.test.js";

const check = makeFunctionReference<"action", CheckArgs, unknown>(
  "scheduled.fixture:check"
);
const track = makeFunctionReference<"action", InternalTrackArgs, unknown>(
  "scheduled.fixture:track"
);

const SCHEDULED_CUSTOMER_ID = "customer-the-caller-authorized";

function captureRequests() {
  const requests: Request[] = [];
  vi.stubGlobal("fetch", async (input: RequestInfo | URL) => {
    requests.push(new Request(input));
    return response({
      customer_id: SCHEDULED_CUSTOMER_ID,
      value: 1,
      balance: null,
    });
  });
  return requests;
}

async function requestBody(request: Request): Promise<Record<string, unknown>> {
  return JSON.parse(await request.clone().text()) as Record<string, unknown>;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

/**
 * The fixture client resolves its customer from `ctx.auth`, which is what an
 * application does. Scheduled work runs without that auth, so these tests invoke
 * the actions with no identity at all.
 */
describe("customer identity without an auth context", () => {
  test("an internal action runs with the customer its caller passed", async () => {
    const requests = captureRequests();
    const t = initConvexTest(defineSchema({}));

    await expect(
      t.action(track, {
        customerId: SCHEDULED_CUSTOMER_ID,
        featureId: "messages",
        value: 1,
        operationId: "scheduled-1",
      })
    ).resolves.toMatchObject({ customerId: SCHEDULED_CUSTOMER_ID });

    expect(requests).toHaveLength(1);
    await expect(requestBody(requests[0]!)).resolves.toMatchObject({
      customer_id: SCHEDULED_CUSTOMER_ID,
    });
  });

  test("an internal action ignores the identity of whoever is signed in", async () => {
    const requests = captureRequests();
    const t = initConvexTest(defineSchema({}));

    await t
      .withIdentity({ subject: "a-different-signed-in-user" })
      .action(track, {
        customerId: SCHEDULED_CUSTOMER_ID,
        featureId: "messages",
        value: 1,
        operationId: "scheduled-2",
      });

    await expect(requestBody(requests[0]!)).resolves.toMatchObject({
      customer_id: SCHEDULED_CUSTOMER_ID,
    });
  });

  test("an internal action rejects an empty customer from its caller", async () => {
    const requests = captureRequests();
    const t = initConvexTest(defineSchema({}));

    const caught = await t
      .action(track, {
        customerId: "",
        featureId: "messages",
        value: 1,
        operationId: "scheduled-3",
      })
      .catch((error) => error);

    expect(errorData(caught)).toMatchObject({
      code: "AUTUMN_VALIDATION_ERROR",
      operation: "track",
    });
    expect(requests).toHaveLength(0);
  });

  test.each([
    ["empty", ""],
    ["overlong", "x".repeat(257)],
    ["lone high surrogate", "\ud800"],
    ["lone low surrogate", "\udc00"],
  ])(
    "rejects the %s operation ID as local validation",
    async (_name, operationId) => {
      const requests = captureRequests();
      const t = initConvexTest(defineSchema({}));

      const caught = await t
        .action(track, {
          customerId: SCHEDULED_CUSTOMER_ID,
          featureId: "messages",
          value: 1,
          operationId,
        })
        .catch((error) => error);

      expect(errorData(caught)).toMatchObject({
        code: "AUTUMN_VALIDATION_ERROR",
        operation: "track",
      });
      expect(requests).toHaveLength(0);
    }
  );

  test("a public read action still fails without an identity to derive", async () => {
    const requests = captureRequests();
    const t = initConvexTest(defineSchema({}));

    const caught = await t
      .action(check, { featureId: "messages" })
      .catch((error) => error);

    expect(errorData(caught)).toMatchObject({
      code: "AUTUMN_CONFIGURATION_ERROR",
      operation: "check",
    });
    expect(requests).toHaveLength(0);
  });

  test("a public read action derives its customer from the signed-in user", async () => {
    const requests = captureRequests();
    const t = initConvexTest(defineSchema({}));

    await t
      .withIdentity({ subject: "signed-in-user" })
      .action(check, { featureId: "messages" });

    await expect(requestBody(requests[0]!)).resolves.toMatchObject({
      customer_id: "signed-in-user",
    });
  });
});
