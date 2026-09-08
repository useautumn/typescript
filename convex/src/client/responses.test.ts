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
import { AutumnError, UnexpectedClientError } from "autumn-js";
import { defineSchema, makeFunctionReference } from "convex/server";
import type { InternalTrackArgs } from "../types.js";
import { AutumnIndeterminateError, AutumnValidationError } from "../errors.js";
import { deriveProviderKey } from "../idempotency.js";
import { errorData, initConvexTest } from "./setup.test.js";
import {
  closeResponseServer,
  directClient,
  planResponse,
  requestBody,
  requestCount,
  requestHeaders,
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
 * error is caught. Node reports such a rejection after the promise settles, so
 * this flushes the event loop before it looks.
 *
 * Every test calls this before it inspects the error data, because an assertion
 * on the data would otherwise fail first and hide the rejection.
 */
async function expectNoUnhandledRejections(): Promise<void> {
  await new Promise(setImmediate);
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
    expect(JSON.parse(requestBody())).toEqual({
      customer_id: CUSTOMER_ID,
      feature_id: "messages",
    });
    expect(requestHeaders().get("idempotency-key")).toBe(
      await deriveProviderKey({
        operation: "track",
        operationNamespace: "responses-fixture",
        customerId: CUSTOMER_ID,
        operationId: "complete-200",
      })
    );
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

/**
 * A direct method has no error data to read a status from, so the status has to
 * reach its caller in the error itself. Trusted server code decides on that
 * error alone whether an operation may still have been applied.
 */
describe("direct methods against a real HTTP server", () => {
  const args = (operationId: string) => ({
    featureId: "messages",
    operationId,
  });

  test.each([[409], [500]])(
    "reports an ambiguous HTTP %i with an unreadable body as indeterminate",
    async (status) => {
      planResponse({ status, body: "truncated" });

      const caught = await directClient()
        .track(null, args(`direct-truncated-${status}`))
        .catch((error: unknown) => error);

      await expectNoUnhandledRejections();
      expect(caught).toBeInstanceOf(AutumnIndeterminateError);
      expect(caught).toMatchObject({
        code: "AUTUMN_INDETERMINATE",
        operation: "track",
        statusCode: status,
      });
      expect(requestCount()).toBe(1);
    }
  );

  test("leaves a rejected HTTP 422 with an unreadable body on the SDK error", async () => {
    planResponse({ status: 422, body: "truncated" });

    const caught = await directClient()
      .track(null, args("direct-truncated-422"))
      .catch((error: unknown) => error);

    await expectNoUnhandledRejections();
    // The server rejected the request definitively, so nothing about the outcome
    // became uncertain when its body stopped short.
    expect(caught).not.toBeInstanceOf(AutumnIndeterminateError);
    expect(caught).toBeInstanceOf(UnexpectedClientError);
    expect(requestCount()).toBe(1);
  });

  /**
   * Unsupported exotic values are rejected before the SDK can stringify them.
   * This keeps its second result promise from rejecting after the caller has
   * already caught the first failure.
   */
  test.each([
    [
      "a class instance",
      () => {
        class ClassPayload {
          amount = 10n;
        }
        return new ClassPayload();
      },
    ],
    ["a BigInt64Array", () => new BigInt64Array([1n])],
  ])(
    "rejects unsupported %s data without reaching the server",
    async (_description, build) => {
      planResponse({ status: 200, body: "complete" });

      const caught = await directClient()
        .track(null, {
          featureId: "messages",
          properties: { payload: build() },
          operationId: "direct-hidden-bigint",
        })
        .catch((error: unknown) => error);

      await expectNoUnhandledRejections();
      expect(caught).toBeInstanceOf(AutumnValidationError);
      expect(requestCount()).toBe(0);
    }
  );

  /**
   * A cycle fails the same way and for the same reason: the SDK's
   * `JSON.stringify` of a request that refers back to itself throws outside its
   * own guarded region, so accepting one here returned a raw `TypeError` to the
   * caller and left the SDK's second result promise rejected with nothing
   * attached to it.
   */
  test("rejects a cyclic request without reaching the server", async () => {
    planResponse({ status: 200, body: "complete" });
    const properties: Record<string, unknown> = { source: "runtime" };
    properties.self = properties;

    const caught = await directClient()
      .track(null, {
        featureId: "messages",
        properties,
        operationId: "direct-cyclic",
      })
      .catch((error: unknown) => error);

    await expectNoUnhandledRejections();
    expect(caught).toBeInstanceOf(AutumnValidationError);
    expect(requestCount()).toBe(0);
  });

  test("sends detached snapshot bytes after the source mutates", async () => {
    planResponse({ status: 200, body: "complete" });
    const source = { label: "before", items: [1] };
    let reads = 0;
    const properties = {
      get payload() {
        reads += 1;
        return source;
      },
      get mutateSource() {
        source.label = "after";
        source.items.push(2);
        return true;
      },
    };

    await directClient()
      .track(null, {
        featureId: "messages",
        properties,
        operationId: "detached-source",
      })
      .catch(() => undefined);

    await expectNoUnhandledRejections();
    expect(source).toEqual({ label: "after", items: [1, 2] });
    expect(reads).toBe(1);
    expect(JSON.parse(requestBody())).toMatchObject({
      properties: { payload: { label: "before", items: [1] } },
    });
    expect(requestCount()).toBe(1);
  });

  test("rejects cross-domain sharing before the loopback server", async () => {
    planResponse({ status: 200, body: "complete" });
    const shared = new Date("2026-01-01T00:00:00.000Z");

    const caught = await directClient()
      .billing.attach(null, {
        planId: "pro",
        checkoutSessionParams: { at: shared },
        successUrl: shared,
        operationId: "cross-domain",
      } as never)
      .catch((error: unknown) => error);

    await expectNoUnhandledRejections();
    expect(caught).toBeInstanceOf(AutumnValidationError);
    expect(requestCount()).toBe(0);
  });

  test("leaves a complete HTTP 409 on the SDK error with its status", async () => {
    planResponse({ status: 409, body: "complete" });

    const caught = await directClient()
      .track(null, args("direct-complete-409"))
      .catch((error: unknown) => error);

    await expectNoUnhandledRejections();
    expect(caught).not.toBeInstanceOf(AutumnIndeterminateError);
    expect(caught).toBeInstanceOf(AutumnError);
    expect(caught).toMatchObject({ statusCode: 409 });
    expect(requestCount()).toBe(1);
  });
});
