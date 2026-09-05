// @vitest-environment node
/// <reference types="vite/client" />

import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  test,
} from "vitest";
import { setTimeout as delay } from "node:timers/promises";
import { defineSchema, makeFunctionReference } from "convex/server";
import type { InternalTrackArgs } from "../types.js";
import { errorData, initConvexTest } from "./setup.test.js";
import {
  closeResponseServer,
  planResponse,
  requestCount,
} from "./responses.fixture.js";

const CUSTOMER_ID = "customer-1";
const INDETERMINATE = "The Autumn operation has an indeterminate outcome.";
const REJECTED = "Autumn rejected the request.";

const track = makeFunctionReference<"action", InternalTrackArgs, unknown>(
  "responses.fixture:track"
);
const trackWithTimeout = makeFunctionReference<
  "action",
  InternalTrackArgs,
  unknown
>("responses.fixture:trackWithTimeout");

const rejections: unknown[] = [];
function record(reason: unknown): void {
  rejections.push(reason);
}

beforeAll(() => {
  process.on("unhandledRejection", record);
});

afterAll(async () => {
  process.off("unhandledRejection", record);
  await closeResponseServer();
});

beforeEach(() => {
  rejections.length = 0;
});

/**
 * Assert that the call left no unhandled rejection behind.
 *
 * The SDK hands its result to a promise it also unwraps a second time, and an
 * error that escapes the guarded fetcher path rejects that second promise with
 * nothing attached to it, which ends a Node 24 process even where the action
 * error is caught. Node reports such a rejection a turn after the promise
 * settles, so this leaves the current turn before it looks.
 *
 * Every test calls this before it inspects the error data, because an assertion
 * on the data would otherwise fail first and hide the rejection.
 */
async function expectNoUnhandledRejections(): Promise<void> {
  await delay(20);
  expect(
    rejections.map((reason) =>
      reason instanceof Error ? `${reason.name}: ${reason.message}` : reason
    )
  ).toEqual([]);
}

describe("responses from a real HTTP server", () => {
  test("returns the native result when the body arrives complete", async () => {
    planResponse({ status: 200, body: "complete" });
    const t = initConvexTest(defineSchema({}));

    const result = await t.action(track, {
      customerId: CUSTOMER_ID,
      featureId: "messages",
      operationId: "complete-200",
    });

    await expectNoUnhandledRejections();
    expect(result).toEqual({
      customerId: CUSTOMER_ID,
      value: 1,
      balance: null,
    });
    expect(requestCount()).toBe(1);
  });

  test.each([
    [409, "AUTUMN_INDETERMINATE", INDETERMINATE],
    [500, "AUTUMN_INDETERMINATE", INDETERMINATE],
    [422, "AUTUMN_REQUEST_FAILED", REJECTED],
  ])(
    "reports HTTP %i with a complete body as %s",
    async (status, code, message) => {
      planResponse({ status, body: "complete" });
      const t = initConvexTest(defineSchema({}));

      const caught = await t
        .action(track, {
          customerId: CUSTOMER_ID,
          featureId: "messages",
          operationId: `complete-${status}`,
        })
        .catch((error) => error);

      await expectNoUnhandledRejections();
      expect(errorData(caught)).toEqual({
        code,
        operation: "track",
        statusCode: status,
        message,
      });
      expect(requestCount()).toBe(1);
    }
  );

  /**
   * The status line reaches the client before the body stops, so the outcome the
   * server reported survives a body the client can never finish reading. A 409
   * or a 5xx stays indeterminate and a 422 stays a definitive rejection.
   */
  test.each([
    [200, "AUTUMN_INDETERMINATE", INDETERMINATE],
    [409, "AUTUMN_INDETERMINATE", INDETERMINATE],
    [500, "AUTUMN_INDETERMINATE", INDETERMINATE],
    [422, "AUTUMN_REQUEST_FAILED", REJECTED],
  ])(
    "keeps the HTTP %i status when the server truncates the body",
    async (status, code, message) => {
      planResponse({ status, body: "truncated" });
      const t = initConvexTest(defineSchema({}));

      const caught = await t
        .action(track, {
          customerId: CUSTOMER_ID,
          featureId: "messages",
          operationId: `truncated-${status}`,
        })
        .catch((error) => error);

      await expectNoUnhandledRejections();
      expect(errorData(caught)).toEqual({
        code,
        operation: "track",
        statusCode: status,
        message,
      });
      // Nothing reconciles an outcome the client could not read, so the action
      // reports it once instead of asking the server again.
      expect(requestCount()).toBe(1);
    }
  );

  test("keeps the status when the timeout ends a stalled body read", async () => {
    planResponse({ status: 422, body: "stalled" });
    const t = initConvexTest(defineSchema({}));

    const caught = await t
      .action(trackWithTimeout, {
        customerId: CUSTOMER_ID,
        featureId: "messages",
        operationId: "stalled-422",
      })
      .catch((error) => error);

    await expectNoUnhandledRejections();
    // The body read is awaited inside the transport, so the client's own timeout
    // ends it rather than the read outliving the request.
    expect(errorData(caught)).toEqual({
      code: "AUTUMN_REQUEST_FAILED",
      operation: "track",
      statusCode: 422,
      message: REJECTED,
    });
    expect(requestCount()).toBe(1);
  });
});
