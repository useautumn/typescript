/// <reference types="vite/client" />

import { afterEach, describe, expect, test, vi } from "vitest";
import { defineSchema, makeFunctionReference } from "convex/server";
import type {
  CheckArgs,
  GetCustomerArgs,
  InternalConsumeCheckArgs,
  InternalTrackArgs,
  InternalUpdateBalanceArgs,
} from "../types.js";
import { deriveProviderKey } from "../idempotency.js";
import { errorData, initConvexTest, response } from "./setup.test.js";

const CUSTOMER_ID = "customer-1";

const check = makeFunctionReference<"action", CheckArgs, unknown>(
  "actions.fixture:check"
);
const consumeCheck = makeFunctionReference<
  "action",
  InternalConsumeCheckArgs,
  unknown
>("actions.fixture:consumeCheck");
const track = makeFunctionReference<"action", InternalTrackArgs, unknown>(
  "actions.fixture:track"
);
const updateBalance = makeFunctionReference<
  "action",
  InternalUpdateBalanceArgs,
  unknown
>("actions.fixture:updateBalance");
const getCustomer = makeFunctionReference<"action", GetCustomerArgs, unknown>(
  "actions.fixture:getCustomer"
);
const trackWithoutOperationId = makeFunctionReference<
  "action",
  { customerId: string; featureId: string },
  unknown
>("actions.fixture:track");

type BalanceUpdateFields = Omit<
  InternalUpdateBalanceArgs,
  "customerId" | "featureId" | "operationId"
>;

const VALID_BALANCE_UPDATES: Array<
  [string, BalanceUpdateFields, Record<string, unknown>]
> = [
  ["identity only", {}, {}],
  ["remaining only", { remaining: 100 }, { remaining: 100 }],
  ["zero remaining", { remaining: 0 }, { remaining: 0 }],
  ["usage only", { usage: 100 }, { usage: 100 }],
  ["zero usage", { usage: 0 }, { usage: 0 }],
  ["grant only", { includedGrant: 100 }, { included_grant: 100 }],
  [
    "reset only",
    { nextResetAt: 1_750_000_000_000 },
    { next_reset_at: 1_750_000_000_000 },
  ],
  [
    "expiry only",
    { expiresAt: 1_760_000_000_000 },
    { expires_at: 1_760_000_000_000 },
  ],
  [
    "combined grant and timing",
    {
      interval: "month",
      includedGrant: 100,
      balanceId: "balance-1",
      nextResetAt: 1_750_000_000_000,
      expiresAt: 1_760_000_000_000,
    },
    {
      interval: "month",
      included_grant: 100,
      balance_id: "balance-1",
      next_reset_at: 1_750_000_000_000,
      expires_at: 1_760_000_000_000,
    },
  ],
];

const INVALID_BALANCE_UPDATES: Array<[string, BalanceUpdateFields]> = [
  ["remaining and addToBalance", { remaining: 1, addToBalance: 1 }],
  ["zero remaining and addToBalance", { remaining: 0, addToBalance: 1 }],
  ["remaining and zero addToBalance", { remaining: 1, addToBalance: 0 }],
  ["remaining and usage", { remaining: 1, usage: 1 }],
  ["zero remaining and usage", { remaining: 0, usage: 1 }],
  ["remaining and zero usage", { remaining: 1, usage: 0 }],
  ["addToBalance and usage", { addToBalance: 1, usage: 1 }],
  ["zero addToBalance and usage", { addToBalance: 0, usage: 1 }],
  ["addToBalance and zero usage", { addToBalance: 1, usage: 0 }],
];

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

/** Everything Convex would run later on the action's behalf. */
async function scheduledFunctions(
  t: ReturnType<typeof initConvexTest>
): Promise<unknown[]> {
  return await t.run(
    async (ctx) => await ctx.db.system.query("_scheduled_functions").collect()
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("generated mutation actions", () => {
  test("enforces generated action validators before transport", async () => {
    const fetcher = vi.fn();
    vi.stubGlobal("fetch", fetcher);
    const t = initConvexTest(defineSchema({}));

    await expect(
      t.action(trackWithoutOperationId, {
        customerId: CUSTOMER_ID,
        featureId: "messages",
      })
    ).rejects.toThrow("operationId");
    expect(fetcher).not.toHaveBeenCalled();
  });

  test("makes one keyed provider call and round-trips the native result", async () => {
    const keys: string[] = [];
    const fetcher = vi.fn(async (input: RequestInfo | URL) => {
      keys.push(new Request(input).headers.get("idempotency-key")!);
      return response(trackResponse(3));
    });
    vi.stubGlobal("fetch", fetcher);
    const t = initConvexTest(defineSchema({}));
    const args = {
      customerId: CUSTOMER_ID,
      featureId: "messages",
      value: 3,
      operationId: "success-1",
    };

    const result = await t.action(track, args);

    expect(result).toEqual({
      customerId: "customer-1",
      value: 3,
      balance: null,
    });
    expect(JSON.parse(JSON.stringify(result))).toEqual(result);
    expect(fetcher).toHaveBeenCalledOnce();
    expect(keys[0]).toMatch(/^autumn-1-/);
    expect(await scheduledFunctions(t)).toEqual([]);
  });

  test.each(VALID_BALANCE_UPDATES)(
    "sends the %s update once without scheduled work",
    async (name, fields, expectedFields) => {
      const requests: Request[] = [];
      const fetcher = vi.fn(async (input: RequestInfo | URL) => {
        requests.push(new Request(input));
        return response({ success: true });
      });
      vi.stubGlobal("fetch", fetcher);
      const t = initConvexTest(defineSchema({}));

      const operationId = `balance-${name.replaceAll(" ", "-")}`;
      await expect(
        t.action(updateBalance, {
          customerId: CUSTOMER_ID,
          featureId: "api_calls",
          ...fields,
          operationId,
        })
      ).resolves.toEqual({ success: true });

      expect(fetcher).toHaveBeenCalledOnce();
      const request = requests[0]!;
      expect(request.headers.get("idempotency-key")).toBe(
        await deriveProviderKey({
          operation: "balances.update",
          operationNamespace: "actions-fixture",
          operationId,
        })
      );
      expect(await request.json()).toEqual({
        customer_id: CUSTOMER_ID,
        feature_id: "api_calls",
        ...expectedFields,
      });
      expect(await scheduledFunctions(t)).toEqual([]);
    }
  );

  test.each(INVALID_BALANCE_UPDATES)(
    "rejects %s before the generated balance update runs",
    async (name, fields) => {
      const fetcher = vi.fn();
      vi.stubGlobal("fetch", fetcher);
      const t = initConvexTest(defineSchema({}));

      await expect(
        t.action(updateBalance, {
          customerId: CUSTOMER_ID,
          featureId: "api_calls",
          ...fields,
          operationId: `invalid-${name.replaceAll(" ", "-")}`,
        })
      ).rejects.toThrow("at most one");
      expect(fetcher).not.toHaveBeenCalled();
      expect(await scheduledFunctions(t)).toEqual([]);
    }
  );

  test("sends the same operation under the same key on every invocation", async () => {
    const keys: string[] = [];
    const fetcher = vi.fn(async (input: RequestInfo | URL) => {
      keys.push(new Request(input).headers.get("idempotency-key")!);
      return response(trackResponse());
    });
    vi.stubGlobal("fetch", fetcher);
    const t = initConvexTest(defineSchema({}));
    const args = {
      customerId: CUSTOMER_ID,
      featureId: "messages",
      value: 1,
      operationId: "stable-key-1",
    };

    await t.action(track, args);
    await t.action(track, { ...args, value: 2 });

    // Nothing is stored here, so a caller that invokes the action twice sends
    // two requests. Both carry the key Autumn needs to reject the second one,
    // and a changed payload does not move it.
    expect(fetcher).toHaveBeenCalledTimes(2);
    expect(new Set(keys).size).toBe(1);
  });

  test.each([202, 409, 500])(
    "reports HTTP %s as indeterminate without a second attempt",
    async (status) => {
      const fetcher = vi.fn(async () =>
        response(
          status === 202 ? trackResponse() : { message: "failure" },
          status
        )
      );
      vi.stubGlobal("fetch", fetcher);
      const t = initConvexTest(defineSchema({}));

      const caught = await t
        .action(track, {
          customerId: CUSTOMER_ID,
          featureId: "messages",
          operationId: `indeterminate-${status}`,
        })
        .catch((error) => error);

      expect(errorData(caught)).toMatchObject({
        code: "AUTUMN_INDETERMINATE",
        operation: "track",
        statusCode: status,
      });
      expect(fetcher).toHaveBeenCalledOnce();
      // Reconciling an unknown outcome needs the state Autumn holds, so the
      // action neither retries in place nor leaves work behind to retry later.
      expect(await scheduledFunctions(t)).toEqual([]);
    }
  );

  test("fails closed on HTTP 429 without a second attempt", async () => {
    const fetcher = vi.fn(async () =>
      response({ message: "rate limited" }, 429)
    );
    vi.stubGlobal("fetch", fetcher);
    const t = initConvexTest(defineSchema({}));

    const caught = await t
      .action(track, {
        customerId: CUSTOMER_ID,
        featureId: "messages",
        operationId: "rate-limit-1",
      })
      .catch((error) => error);

    expect(errorData(caught)).toMatchObject({
      code: "AUTUMN_REQUEST_FAILED",
      operation: "track",
      statusCode: 429,
    });
    expect(fetcher).toHaveBeenCalledOnce();
    expect(await scheduledFunctions(t)).toEqual([]);
  });

  test("reports a malformed success response without resending", async () => {
    const fetcher = vi.fn(
      async () =>
        new Response("{", {
          status: 200,
          headers: { "content-type": "application/json" },
        })
    );
    vi.stubGlobal("fetch", fetcher);
    const t = initConvexTest(defineSchema({}));

    const caught = await t
      .action(track, {
        customerId: CUSTOMER_ID,
        featureId: "messages",
        operationId: "malformed-1",
      })
      .catch((error) => error);

    expect(errorData(caught)).toMatchObject({
      code: "AUTUMN_INDETERMINATE",
      operation: "track",
      statusCode: 200,
    });
    expect(fetcher).toHaveBeenCalledOnce();
    expect(await scheduledFunctions(t)).toEqual([]);
  });

  test.each([
    ["network", () => new TypeError("socket closed")],
    ["timeout", () => new DOMException("timed out", "TimeoutError")],
    ["abort", () => new DOMException("aborted", "AbortError")],
  ])(
    "reports a %s failure as indeterminate without a second attempt",
    async (kind, createError) => {
      const fetcher = vi.fn(async () => {
        throw createError();
      });
      vi.stubGlobal("fetch", fetcher);
      const t = initConvexTest(defineSchema({}));

      const caught = await t
        .action(track, {
          customerId: CUSTOMER_ID,
          featureId: "messages",
          operationId: `${kind}-1`,
        })
        .catch((error) => error);

      expect(errorData(caught)).toMatchObject({
        code: "AUTUMN_INDETERMINATE",
        operation: "track",
      });
      expect(fetcher).toHaveBeenCalledOnce();
      expect(await scheduledFunctions(t)).toEqual([]);
    }
  );

  test("reports definitive failures with safe ConvexError data", async () => {
    const fetcher = vi.fn(async () =>
      response({ private: "provider body" }, 422)
    );
    vi.stubGlobal("fetch", fetcher);
    const t = initConvexTest(defineSchema({}));

    const caught = await t
      .action(track, {
        customerId: CUSTOMER_ID,
        featureId: "messages",
        operationId: "failure-1",
      })
      .catch((error) => error);

    expect(errorData(caught)).toEqual({
      code: "AUTUMN_REQUEST_FAILED",
      operation: "track",
      statusCode: 422,
      message: "Autumn rejected the request.",
    });
    expect(JSON.stringify(errorData(caught))).not.toContain("provider body");
    expect(fetcher).toHaveBeenCalledOnce();
    expect(await scheduledFunctions(t)).toEqual([]);
  });

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
    ["customerId", "customer-2"],
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

  test("reports a mutation result Convex cannot encode without resending it", async () => {
    const fetcher = vi.fn(async () =>
      response(checkResponse({ $reserved: null }))
    );
    vi.stubGlobal("fetch", fetcher);
    const t = initConvexTest(defineSchema({}));

    const caught = await t
      .action(consumeCheck, {
        customerId: CUSTOMER_ID,
        featureId: "messages",
        operationId: "unserializable-1",
      })
      .catch((error) => error);

    // The operation reached Autumn and only its result is unusable, so the
    // action reports that and stops.
    expect(errorData(caught)).toEqual({
      code: "AUTUMN_RESULT_UNSERIALIZABLE",
      operation: "check",
      message: "The Autumn response cannot be serialized by Convex.",
    });
    expect(fetcher).toHaveBeenCalledOnce();
    expect(await scheduledFunctions(t)).toEqual([]);
  });
});
