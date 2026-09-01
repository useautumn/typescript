/// <reference types="vite/client" />

import { afterEach, describe, expect, test, vi } from "vitest";
import { ConvexError } from "convex/values";
import { defineSchema, makeFunctionReference } from "convex/server";
import type {
  CheckArgs,
  ConsumeCheckArgs,
  GetCustomerArgs,
  TrackArgs,
} from "../types.js";
import { initConvexTest } from "./setup.test.js";

const check = makeFunctionReference<"action", CheckArgs, unknown>(
  "actions.fixture:check"
);
const consumeCheck = makeFunctionReference<"action", ConsumeCheckArgs, unknown>(
  "actions.fixture:consumeCheck"
);
const track = makeFunctionReference<"action", TrackArgs, unknown>(
  "actions.fixture:track"
);
const getCustomer = makeFunctionReference<"action", GetCustomerArgs, unknown>(
  "actions.fixture:getCustomer"
);
const trackWithoutOperationId = makeFunctionReference<
  "action",
  { featureId: string },
  unknown
>("actions.fixture:track");

function response(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function trackResponse(value = 1) {
  return {
    customer_id: "customer-1",
    value,
    balance: null,
  };
}

/**
 * `balances` is keyed by provider-supplied feature IDs, so it is the one
 * response field that can carry a field name Convex refuses to encode.
 */
function checkResponse(balances: Record<string, null>) {
  return {
    allowed: true,
    customer_id: "customer-1",
    balance: null,
    flag: null,
    balances,
  };
}

type ErrorData = {
  code: string;
  operation: string;
  statusCode?: number;
  message: string;
};

function errorData(error: unknown): ErrorData {
  expect(error).toBeInstanceOf(ConvexError);
  const data = (error as ConvexError<ErrorData | string>).data;
  return typeof data === "string" ? (JSON.parse(data) as ErrorData) : data;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("generated action ledger", () => {
  test("enforces generated action validators before transport", async () => {
    const fetcher = vi.fn();
    vi.stubGlobal("fetch", fetcher);
    const t = initConvexTest(defineSchema({}));

    await expect(
      t.action(trackWithoutOperationId, { featureId: "messages" })
    ).rejects.toThrow("operationId");
    expect(fetcher).not.toHaveBeenCalled();
  });

  test("round-trips a native result and replays the stored terminal value", async () => {
    const fetcher = vi.fn(async () => response(trackResponse(3)));
    vi.stubGlobal("fetch", fetcher);
    const t = initConvexTest(defineSchema({}));
    const args = {
      featureId: "messages",
      value: 3,
      operationId: "success-1",
    };

    const first = await t.action(track, args);
    const second = await t.action(track, args);

    expect(first).toEqual({
      customerId: "customer-1",
      value: 3,
      balance: null,
    });
    expect(second).toEqual(first);
    expect(fetcher).toHaveBeenCalledOnce();
    expect(JSON.parse(JSON.stringify(second))).toEqual(second);
  });

  test("conflicts when an operationId is reused with changed payload", async () => {
    const fetcher = vi.fn(async () => response(trackResponse()));
    vi.stubGlobal("fetch", fetcher);
    const t = initConvexTest(defineSchema({}));

    await t.action(track, {
      featureId: "messages",
      value: 1,
      operationId: "conflict-1",
    });
    const error = await t
      .action(track, {
        featureId: "messages",
        value: 2,
        operationId: "conflict-1",
      })
      .catch((caught) => caught);

    expect(errorData(error)).toEqual({
      code: "AUTUMN_OPERATION_CONFLICT",
      operation: "track",
      message: "operationId was already used with different arguments.",
    });
    expect(fetcher).toHaveBeenCalledOnce();
  });

  test.each([202, 409, 500])(
    "persists HTTP %s as indeterminate and never retries",
    async (status) => {
      const fetcher = vi.fn(async () =>
        response(
          status === 202 ? trackResponse() : { message: "failure" },
          status
        )
      );
      vi.stubGlobal("fetch", fetcher);
      const t = initConvexTest(defineSchema({}));
      const args = {
        featureId: "messages",
        operationId: `indeterminate-${status}`,
      };

      const first = await t.action(track, args).catch((caught) => caught);
      const replay = await t.action(track, args).catch((caught) => caught);

      expect(errorData(first)).toMatchObject({
        code: "AUTUMN_INDETERMINATE",
        operation: "track",
        statusCode: status,
      });
      expect(errorData(replay)).toMatchObject({
        code: "AUTUMN_INDETERMINATE",
        operation: "track",
      });
      expect(fetcher).toHaveBeenCalledOnce();
    }
  );

  test.each([
    ["network", () => new TypeError("socket closed")],
    ["timeout", () => new DOMException("timed out", "TimeoutError")],
    ["abort", () => new DOMException("aborted", "AbortError")],
  ])(
    "persists %s failure as indeterminate and never retries",
    async (kind, createError) => {
      const fetcher = vi.fn(async () => {
        throw createError();
      });
      vi.stubGlobal("fetch", fetcher);
      const t = initConvexTest(defineSchema({}));
      const args = { featureId: "messages", operationId: `${kind}-1` };

      const first = await t.action(track, args).catch((caught) => caught);
      const replay = await t.action(track, args).catch((caught) => caught);

      expect(errorData(first)).toMatchObject({
        code: "AUTUMN_INDETERMINATE",
        operation: "track",
      });
      expect(errorData(replay)).toMatchObject({
        code: "AUTUMN_INDETERMINATE",
        operation: "track",
      });
      expect(fetcher).toHaveBeenCalledOnce();
    }
  );

  test("sanitizes errors from generated read actions", async () => {
    const fetcher = vi.fn(async () =>
      response({ private: "provider body" }, 422)
    );
    vi.stubGlobal("fetch", fetcher);
    const t = initConvexTest(defineSchema({}));

    const caught = await t.action(getCustomer, {}).catch((error) => error);

    expect(errorData(caught)).toEqual({
      code: "AUTUMN_REQUEST_FAILED",
      operation: "customers.get",
      statusCode: 422,
      message: "Autumn rejected the request.",
    });
    expect(JSON.stringify(errorData(caught))).not.toContain("provider body");
    expect(fetcher).toHaveBeenCalledOnce();
  });

  test.each([
    ["sendEvent", true],
    ["operationId", "consume-1"],
  ])("rejects %s on the public check action", async (field, value) => {
    const fetcher = vi.fn();
    vi.stubGlobal("fetch", fetcher);
    const t = initConvexTest(defineSchema({}));

    await expect(
      t.action(check, {
        featureId: "messages",
        [field]: value,
      } as CheckArgs)
    ).rejects.toThrow(field);
    expect(fetcher).not.toHaveBeenCalled();
  });

  test("keeps a valid provider field map in the returned result", async () => {
    const fetcher = vi.fn(async () =>
      response(checkResponse({ messages: null }))
    );
    vi.stubGlobal("fetch", fetcher);
    const t = initConvexTest(defineSchema({}));

    await expect(t.action(check, { featureId: "messages" })).resolves.toEqual({
      allowed: true,
      customerId: "customer-1",
      balance: null,
      flag: null,
      balances: { messages: null },
    });
    expect(fetcher).toHaveBeenCalledOnce();
  });

  test("rejects a Convex-invalid field before the action response boundary", async () => {
    const fetcher = vi.fn(async () =>
      response(checkResponse({ $reserved: null }))
    );
    vi.stubGlobal("fetch", fetcher);
    const t = initConvexTest(defineSchema({}));

    const caught = await t
      .action(check, { featureId: "messages" })
      .catch((error) => error);

    expect(errorData(caught)).toEqual({
      code: "AUTUMN_RESULT_UNSERIALIZABLE",
      operation: "check",
      message: "The Autumn response cannot be serialized by Convex.",
    });
    expect(fetcher).toHaveBeenCalledOnce();
  });

  test("stores an unserializable terminal result as indeterminate", async () => {
    const fetcher = vi.fn(async () =>
      response(checkResponse({ $reserved: null }))
    );
    vi.stubGlobal("fetch", fetcher);
    const t = initConvexTest(defineSchema({}));
    const args = {
      featureId: "messages",
      operationId: "unserializable-1",
    };

    const first = await t.action(consumeCheck, args).catch((caught) => caught);
    const replay = await t.action(consumeCheck, args).catch((caught) => caught);

    expect(errorData(first)).toEqual({
      code: "AUTUMN_RESULT_UNSERIALIZABLE",
      operation: "check",
      message: "The Autumn response cannot be serialized by Convex.",
    });
    expect(errorData(replay)).toMatchObject({
      code: "AUTUMN_INDETERMINATE",
      operation: "check",
    });
    expect(fetcher).toHaveBeenCalledOnce();
  });

  test("stores definitive failures with safe ConvexError data", async () => {
    const fetcher = vi.fn(async () =>
      response({ private: "provider body" }, 422)
    );
    vi.stubGlobal("fetch", fetcher);
    const t = initConvexTest(defineSchema({}));
    const args = { featureId: "messages", operationId: "failure-1" };

    const first = await t.action(track, args).catch((caught) => caught);
    const replay = await t.action(track, args).catch((caught) => caught);

    expect(errorData(first)).toEqual({
      code: "AUTUMN_REQUEST_FAILED",
      operation: "track",
      statusCode: 422,
      message: "Autumn rejected the request.",
    });
    expect(errorData(replay)).toEqual(errorData(first));
    expect(JSON.stringify(errorData(first))).not.toContain("provider body");
    expect(fetcher).toHaveBeenCalledOnce();
  });
});
