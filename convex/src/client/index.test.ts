import { AutumnError, ConnectionError, UnexpectedClientError } from "autumn-js";
import { describe, expect, test, vi } from "vitest";
import { deriveProviderKey } from "../idempotency.js";
import { isTransportIndeterminate } from "../transport.js";
import type { UpdateBalanceArgs } from "../types.js";
import { Autumn, AutumnIndeterminateError } from "./index.js";

type CapturedRequest = {
  method: string;
  path: string;
  headers: Headers;
  body: Record<string, unknown>;
};

type BalanceUpdateFields = Omit<UpdateBalanceArgs, "featureId" | "operationId">;

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

function response(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function client(
  fetcher: typeof fetch,
  customerId = "customer-1",
  operationNamespace = "namespace-1"
) {
  return new Autumn({} as never, {
    secretKey: "test-secret-key",
    serverURL: "https://example.test",
    operationNamespace,
    identify: async () => ({ customerId }),
    fetcher,
  });
}

async function capture(
  execute: (autumn: Autumn<null>) => Promise<unknown>,
  customerId = "customer-1"
): Promise<CapturedRequest> {
  const requests: CapturedRequest[] = [];
  const autumn = client(async (input) => {
    const request = new Request(input);
    requests.push({
      method: request.method,
      path: new URL(request.url).pathname,
      headers: request.headers,
      body: JSON.parse(await request.clone().text()) as Record<string, unknown>,
    });
    return response({ message: "rejected" }, 400);
  }, customerId);
  await execute(autumn).catch(() => undefined);
  expect(requests).toHaveLength(1);
  return requests[0]!;
}

describe("Autumn native transport", () => {
  test("pins transport policy and derives the provider key", async () => {
    const request = await capture((autumn) =>
      autumn.track(null, {
        featureId: "messages",
        value: 2,
        operationId: "caller-operation-id",
      })
    );

    expect(request.headers.get("authorization")).toBe("Bearer test-secret-key");
    expect(request.headers.get("content-type")).toBe("application/json");
    expect(request.headers.get("x-api-version")).toBe("2.3.0");
    expect(request.headers.get("idempotency-key")).toMatch(/^autumn-1-/);
    expect(request.headers.get("idempotency-key")).not.toContain(
      "caller-operation-id"
    );
    expect(request.headers.get("idempotency-key")).not.toContain("customer-1");
    expect(request.headers.get("idempotency-key")).not.toContain("namespace-1");
  });

  test("merges caller headers without replacing managed headers", async () => {
    const fetcher = vi.fn(async (input: RequestInfo | URL) => {
      const request = new Request(input);
      expect(request.headers.get("x-autumn-tenant")).toBe("tenant-1");
      expect(request.headers.get("authorization")).toBe(
        "Bearer test-secret-key"
      );
      return response({ message: "rejected" }, 400);
    });
    const autumn = new Autumn({} as never, {
      secretKey: "test-secret-key",
      serverURL: "https://example.test",
      operationNamespace: "namespace-1",
      identify: async () => ({ customerId: "customer-1" }),
      headers: { "X-Autumn-Tenant": "tenant-1" },
      fetcher,
    });

    await expect(
      autumn.check(null, { featureId: "messages" })
    ).rejects.toBeDefined();
    expect(fetcher).toHaveBeenCalledOnce();
  });

  test.each([
    "Authorization",
    "content-type",
    "X-API-Version",
    "IDEMPOTENCY-KEY",
  ])("rejects protected %s overrides", (header) => {
    expect(
      () =>
        new Autumn({} as never, {
          secretKey: "test-secret-key",
          operationNamespace: "namespace-1",
          identify: async () => ({ customerId: "customer-1" }),
          headers: { [header]: "override" },
        })
    ).toThrow("managed by @useautumn/convex");
  });

  test.each([
    ["empty", ""],
    ["over-long", "n".repeat(257)],
  ])("rejects an %s operationNamespace", (_name, operationNamespace) => {
    expect(
      () =>
        new Autumn({} as never, {
          secretKey: "test-secret-key",
          operationNamespace,
          identify: async () => ({ customerId: "customer-1" }),
        })
    ).toThrow("operationNamespace must be between 1 and 256 characters");
  });

  test("separates keys of clients that share a customer and operation ID", async () => {
    const keys: string[] = [];
    const fetcher = async (input: RequestInfo | URL) => {
      const request = new Request(input);
      keys.push(request.headers.get("idempotency-key")!);
      return response({ message: "rejected" }, 400);
    };
    const args = {
      featureId: "messages",
      value: 1,
      operationId: "same",
    } as const;

    await client(fetcher, "customer-1", "namespace-1")
      .track(null, args)
      .catch(() => undefined);
    await client(fetcher, "customer-1", "namespace-2")
      .track(null, args)
      .catch(() => undefined);

    expect(new Set(keys).size).toBe(2);
  });

  test("fences reused operation IDs across customers and payloads", async () => {
    const keys: string[] = [];
    const fetcher = async (input: RequestInfo | URL) => {
      const request = new Request(input);
      keys.push(request.headers.get("idempotency-key")!);
      return response({ message: "rejected" }, 400);
    };

    await client(fetcher)
      .track(null, {
        featureId: "messages",
        value: 1,
        operationId: "same",
      })
      .catch(() => undefined);
    await client(fetcher)
      .track(null, {
        featureId: "messages",
        value: 2,
        operationId: "same",
      })
      .catch(() => undefined);
    await client(fetcher, "customer-2")
      .track(null, {
        featureId: "messages",
        value: 1,
        operationId: "same",
      })
      .catch(() => undefined);
    await client(fetcher)
      .referrals.create(null, {
        programId: "messages",
        operationId: "same",
      })
      .catch(() => undefined);

    const [firstTrack, changedTrack, otherCustomer, otherRoute] = keys as [
      string,
      string,
      string,
      string,
    ];
    // Within one namespace and mutation action, an operation ID is unique across
    // all customers. Changing the customer or payload deliberately keeps the
    // same key, while another mutation action has its own operation identity.
    expect(changedTrack).toBe(firstTrack);
    expect(otherCustomer).toBe(firstTrack);
    expect(otherRoute).not.toBe(firstTrack);
  });

  test("derives stable keys and bounds operation IDs", async () => {
    const keys: string[] = [];
    const fetcher = vi.fn(async (input: RequestInfo | URL) => {
      const request = new Request(input);
      keys.push(request.headers.get("idempotency-key")!);
      return response({ message: "rejected" }, 400);
    });
    const autumn = client(fetcher);
    const operationId = "o".repeat(256);

    await autumn
      .track(null, {
        eventName: "message.sent",
        properties: { z: 1, a: 2 },
        operationId,
      })
      .catch(() => undefined);
    await autumn
      .track(null, {
        eventName: "message.sent",
        properties: { a: 2, z: 1 },
        operationId,
      })
      .catch(() => undefined);
    await expect(
      autumn.track(null, {
        eventName: "message.sent",
        operationId: "o".repeat(257),
      })
    ).rejects.toThrow("between 1 and 256 characters");

    expect(keys).toEqual([keys[0], keys[0]]);
    expect(fetcher).toHaveBeenCalledTimes(2);
  });

  test("preserves supported native direct-method values", async () => {
    class PropertyValue {
      x = 1;
    }

    const at = new Date("2026-01-01T00:00:00.000Z");
    const blob = new Uint8Array(100_000);
    blob.set([1, 2, 3]);
    blob[blob.length - 1] = 4;
    const delta = 0 * -1;
    expect(Object.is(delta, -0)).toBe(true);

    const request = await capture((autumn) =>
      autumn.track(null, {
        featureId: "messages",
        properties: { at, blob, delta, object: new PropertyValue() },
        operationId: "native-values",
      })
    );

    expect(request.body.properties).toEqual({
      at: "2026-01-01T00:00:00.000Z",
      blob: Buffer.from(blob).toString("base64"),
      delta: 0,
      object: { x: 1 },
    });
  });

  test("omits undefined direct-method request values", async () => {
    const request = await capture((autumn) =>
      autumn.track(null, {
        featureId: "messages",
        entityId: undefined,
        properties: { kept: true, omitted: undefined },
        operationId: "undefined-values",
      })
    );

    expect(request.body).not.toHaveProperty("entity_id");
    expect(request.body.properties).toEqual({ kept: true });
  });

  test("exposes every supported SDK route with native request casing", async () => {
    const cases: Array<{
      name: string;
      path: string;
      execute: (autumn: Autumn<null>) => Promise<unknown>;
      expected: Record<string, unknown>;
    }> = [
      {
        name: "check",
        path: "/v1/balances.check",
        execute: (a) => a.check(null, { featureId: "f" }),
        expected: { customer_id: "customer-1", feature_id: "f" },
      },
      {
        name: "consumeCheck",
        path: "/v1/balances.check",
        execute: (a) =>
          a.consumeCheck(null, { featureId: "f", operationId: "op" }),
        expected: {
          customer_id: "customer-1",
          feature_id: "f",
          send_event: true,
        },
      },
      {
        name: "track",
        path: "/v1/balances.track",
        execute: (a) => a.track(null, { featureId: "f", operationId: "op" }),
        expected: { customer_id: "customer-1", feature_id: "f" },
      },
      {
        name: "previewAttach",
        path: "/v1/billing.preview_attach",
        execute: (a) =>
          a.billing.previewAttach(null, {
            planId: "p",
            featureQuantities: [{ featureId: "seats", quantity: 3 }],
          }),
        expected: {
          customer_id: "customer-1",
          plan_id: "p",
          feature_quantities: [{ feature_id: "seats", quantity: 3 }],
          redirect_mode: "if_required",
        },
      },
      {
        name: "attach",
        path: "/v1/billing.attach",
        execute: (a) =>
          a.billing.attach(null, {
            planId: "p",
            longLivedCheckout: true,
            operationId: "op",
          }),
        expected: {
          customer_id: "customer-1",
          plan_id: "p",
          long_lived_checkout: true,
          redirect_mode: "if_required",
        },
      },
      {
        name: "previewMultiAttach",
        path: "/v1/billing.preview_multi_attach",
        execute: (a) =>
          a.billing.previewMultiAttach(null, {
            plans: [
              {
                planId: "p",
                featureQuantities: [{ featureId: "seats", quantity: 4 }],
              },
            ],
          }),
        expected: {
          customer_id: "customer-1",
          plans: [
            {
              plan_id: "p",
              feature_quantities: [{ feature_id: "seats", quantity: 4 }],
            },
          ],
          redirect_mode: "if_required",
        },
      },
      {
        name: "multiAttach",
        path: "/v1/billing.multi_attach",
        execute: (a) =>
          a.billing.multiAttach(null, {
            plans: [{ planId: "p" }],
            operationId: "op",
          }),
        expected: {
          customer_id: "customer-1",
          plans: [{ plan_id: "p" }],
          redirect_mode: "if_required",
        },
      },
      {
        name: "previewUpdate",
        path: "/v1/billing.preview_update",
        execute: (a) =>
          a.billing.previewUpdate(null, {
            planId: "p",
            invoiceMode: { enabled: true, enablePlanImmediately: true },
            noBillingChanges: true,
            refundLastPayment: "full",
            subscriptionParams: {
              payment_behavior: "pending_if_incomplete",
            },
            recalculateBalances: { enabled: false },
            carryOverUsages: {
              enabled: true,
              featureIds: ["messages"],
            },
          }),
        expected: {
          customer_id: "customer-1",
          plan_id: "p",
          invoice_mode: {
            enabled: true,
            enable_plan_immediately: true,
            finalize: true,
          },
          redirect_mode: "if_required",
          no_billing_changes: true,
          refund_last_payment: "full",
          subscription_params: {
            payment_behavior: "pending_if_incomplete",
          },
          recalculate_balances: { enabled: false },
          carry_over_usages: {
            enabled: true,
            feature_ids: ["messages"],
          },
        },
      },
      {
        name: "update",
        path: "/v1/billing.update",
        execute: (a) =>
          a.billing.update(null, { planId: "p", operationId: "op" }),
        expected: {
          customer_id: "customer-1",
          plan_id: "p",
          redirect_mode: "if_required",
        },
      },
      {
        name: "previewMultiUpdate",
        path: "/v1/billing.preview_multi_update",
        execute: (a) =>
          a.billing.previewMultiUpdate(null, {
            updates: [{ planId: "p", cancelAction: "cancel_immediately" }],
          }),
        expected: {
          customer_id: "customer-1",
          updates: [{ plan_id: "p", cancel_action: "cancel_immediately" }],
        },
      },
      {
        name: "multiUpdate",
        path: "/v1/billing.multi_update",
        execute: (a) =>
          a.billing.multiUpdate(null, {
            updates: [{ planId: "p", cancelAction: "cancel_immediately" }],
            operationId: "op",
          }),
        expected: {
          customer_id: "customer-1",
          updates: [{ plan_id: "p", cancel_action: "cancel_immediately" }],
        },
      },
      {
        name: "setupPayment",
        path: "/v1/billing.setup_payment",
        execute: (a) =>
          a.billing.setupPayment(null, { planId: "p", operationId: "op" }),
        expected: { customer_id: "customer-1", plan_id: "p" },
      },
      {
        name: "portal",
        path: "/v1/billing.open_customer_portal",
        execute: (a) =>
          a.billing.portal(null, {
            configurationId: "bpc_operator",
            returnUrl: "https://app.test",
          }),
        expected: {
          customer_id: "customer-1",
          configuration_id: "bpc_operator",
          return_url: "https://app.test",
        },
      },
      {
        name: "customers.get",
        path: "/v1/customers.get",
        execute: (a) => a.customers.get(null, { expand: ["entities"] }),
        expected: { customer_id: "customer-1", expand: ["entities"] },
      },
      {
        name: "customers.getOrCreate",
        path: "/v1/customers.get_or_create",
        execute: (a) =>
          a.customers.getOrCreate(null, { name: "Ada", operationId: "op" }),
        expected: { customer_id: "customer-1", name: "Ada" },
      },
      {
        name: "customers.update",
        path: "/v1/customers.update",
        execute: (a) =>
          a.customers.update(null, { name: "Ada", operationId: "op" }),
        expected: { customer_id: "customer-1", name: "Ada" },
      },
      {
        name: "customers.delete",
        path: "/v1/customers.delete",
        execute: (a) =>
          a.customers.delete(null, { deleteInStripe: true, operationId: "op" }),
        expected: { customer_id: "customer-1", delete_in_stripe: true },
      },
      {
        name: "entities.create",
        path: "/v1/entities.create",
        execute: (a) =>
          a.entities.create(null, {
            entityId: "e",
            featureId: "seats",
            operationId: "op",
          }),
        expected: {
          customer_id: "customer-1",
          entity_id: "e",
          feature_id: "seats",
        },
      },
      {
        name: "entities.get",
        path: "/v1/entities.get",
        execute: (a) => a.entities.get(null, { entityId: "e" }),
        expected: { customer_id: "customer-1", entity_id: "e" },
      },
      {
        name: "entities.list",
        path: "/v1/entities.list",
        execute: (a) =>
          a.entities.list(null, {
            startCursor: "cursor",
            plans: [{ id: "p", versions: [2] }],
          }),
        expected: {
          customer_id: "customer-1",
          start_cursor: "cursor",
          limit: 50,
          plans: [{ id: "p", versions: [2] }],
        },
      },
      {
        name: "entities.update",
        path: "/v1/entities.update",
        execute: (a) =>
          a.entities.update(null, {
            entityId: "e",
            billingControls: {
              overageAllowed: [{ featureId: "f", enabled: false }],
            },
            operationId: "op",
          }),
        expected: {
          customer_id: "customer-1",
          entity_id: "e",
          billing_controls: {
            overage_allowed: [{ feature_id: "f", enabled: false }],
          },
        },
      },
      {
        name: "entities.delete",
        path: "/v1/entities.delete",
        execute: (a) =>
          a.entities.delete(null, { entityId: "e", operationId: "op" }),
        expected: { customer_id: "customer-1", entity_id: "e" },
      },
      {
        name: "plans.get",
        path: "/v1/plans.get",
        execute: (a) => a.plans.get(null, { planId: "p", version: 2 }),
        expected: { plan_id: "p", version: 2 },
      },
      {
        name: "plans.list",
        path: "/v1/plans.list",
        execute: (a) => a.plans.list(null, { includeArchived: true }),
        expected: { customer_id: "customer-1", include_archived: true },
      },
      {
        name: "balances.update",
        path: "/v1/balances.update",
        execute: (a) =>
          a.balances.update(null, {
            featureId: "f",
            addToBalance: 2,
            operationId: "op",
          }),
        expected: {
          customer_id: "customer-1",
          feature_id: "f",
          add_to_balance: 2,
        },
      },
      {
        name: "events.list",
        path: "/v1/events.list",
        execute: (a) =>
          a.events.list(null, { startCursor: "cursor", featureId: ["f"] }),
        expected: {
          customer_id: "customer-1",
          start_cursor: "cursor",
          limit: 50,
          feature_id: ["f"],
        },
      },
      {
        name: "events.aggregate",
        path: "/v1/events.aggregate",
        execute: (a) =>
          a.events.aggregate(null, {
            featureId: "f",
            customRange: { start: 1, end: 2 },
          }),
        expected: {
          customer_id: "customer-1",
          feature_id: "f",
          custom_range: { start: 1, end: 2 },
          bin_size: "day",
        },
      },
      {
        name: "referrals.create",
        path: "/v1/referrals.create_code",
        execute: (a) =>
          a.referrals.create(null, { programId: "r", operationId: "op" }),
        expected: { customer_id: "customer-1", program_id: "r" },
      },
      {
        name: "referrals.redeem",
        path: "/v1/referrals.redeem_code",
        execute: (a) =>
          a.referrals.redeem(null, { code: "code", operationId: "op" }),
        expected: { customer_id: "customer-1", code: "code" },
      },
    ];

    for (const item of cases) {
      const request = await capture(item.execute);
      expect(request.method, item.name).toBe("POST");
      expect(request.path, item.name).toBe(item.path);
      expect(request.body, item.name).toEqual(item.expected);
    }
  });

  test("returns native camelCase results without an envelope", async () => {
    const autumn = client(async () =>
      response({
        allowed: true,
        customer_id: "customer-1",
        required_balance: 2,
        balance: null,
        flag: null,
      })
    );

    await expect(
      autumn.check(null, { featureId: "messages", requiredBalance: 2 })
    ).resolves.toEqual({
      allowed: true,
      customerId: "customer-1",
      requiredBalance: 2,
      balance: null,
      flag: null,
    });
  });

  test("portal makes one request and returns the native URL", async () => {
    const fetcher = vi.fn(async () =>
      response({
        customer_id: "customer-1",
        url: "https://portal.test/session",
      })
    );
    await expect(client(fetcher).billing.portal(null)).resolves.toEqual({
      customerId: "customer-1",
      url: "https://portal.test/session",
    });
    expect(fetcher).toHaveBeenCalledOnce();
  });

  test("makes HTTP 202 observable without retrying", async () => {
    const fetcher = vi.fn(async () =>
      response(
        {
          allowed: true,
          customer_id: "customer-1",
          balance: null,
          flag: null,
        },
        202
      )
    );
    await expect(
      client(fetcher).check(null, { featureId: "messages" })
    ).rejects.toBeInstanceOf(AutumnIndeterminateError);
    expect(fetcher).toHaveBeenCalledOnce();
  });

  test("makes a malformed success response observable without retrying", async () => {
    const fetcher = vi.fn(
      async () =>
        new Response("{", {
          status: 200,
          headers: { "content-type": "application/json" },
        })
    );
    await expect(
      client(fetcher).track(null, {
        featureId: "messages",
        operationId: "malformed",
      })
    ).rejects.toBeInstanceOf(AutumnIndeterminateError);
    expect(fetcher).toHaveBeenCalledOnce();
  });

  test.each([409, 429, 500, 503])("does not retry HTTP %s", async (status) => {
    const fetcher = vi.fn(async () => response({ message: "failure" }, status));
    await expect(
      client(fetcher).track(null, {
        featureId: "messages",
        operationId: `status-${status}`,
      })
    ).rejects.toBeDefined();
    expect(fetcher).toHaveBeenCalledOnce();
  });

  test("propagates native SDK errors from direct methods", async () => {
    const fetcher = vi.fn(async () =>
      response({ private: "provider body" }, 422)
    );

    await expect(
      client(fetcher).track(null, {
        featureId: "messages",
        operationId: "native-error",
      })
    ).rejects.toBeInstanceOf(AutumnError);
    expect(fetcher).toHaveBeenCalledOnce();
  });

  test("does not reach transport when identification fails", async () => {
    const fetcher = vi.fn();
    const identificationError = new Error("identity unavailable");
    const autumn = new Autumn({} as never, {
      secretKey: "test-secret-key",
      serverURL: "https://example.test",
      operationNamespace: "namespace-1",
      identify: async () => {
        throw identificationError;
      },
      fetcher,
    });

    await expect(
      autumn.track(null, {
        featureId: "messages",
        operationId: "identify-failure",
      })
    ).rejects.toBe(identificationError);
    expect(fetcher).not.toHaveBeenCalled();
  });

  /**
   * A real Node connection failure is `TypeError("fetch failed")`, and the SDK
   * recognizes it by that message prefix. Only this shape becomes a genuine
   * `ConnectionError`, so it is what the indeterminate classifier's
   * `ConnectionError` branch has to be exercised with.
   */
  test("raises the SDK's ConnectionError for a real connection failure", async () => {
    const fetcher = vi.fn(async () => {
      throw new TypeError("fetch failed");
    });
    const caught = await client(fetcher)
      .track(null, { featureId: "messages", operationId: "connection" })
      .catch((error: unknown) => error);

    expect(caught).toBeInstanceOf(ConnectionError);
    expect(isTransportIndeterminate(caught, undefined)).toBe(true);
    expect(fetcher).toHaveBeenCalledOnce();
  });

  /**
   * The four transport failure names are Speakeasy's standard generated ones,
   * and Autumn's SDK is Speakeasy-generated, so any other such SDK reachable
   * from the classified region raises errors carrying exactly them. A name
   * establishes nothing about which SDK failed, and anyone can set one.
   */
  test.each([
    "ConnectionError",
    "UnexpectedClientError",
    "RequestTimeoutError",
    "RequestAbortedError",
  ])("rejects a foreign error named %s", (name) => {
    const foreign = Object.assign(new Error("foreign SDK failure"), { name });

    expect(foreign.name).toBe(name);
    expect(isTransportIndeterminate(foreign, undefined)).toBe(false);
  });

  // The wrapper this package's own unreadable-body path reaches the classifier
  // as, built here directly so the class branch is pinned without a server.
  test("admits the SDK client error a failed body read is wrapped in", () => {
    const wrapped = new UnexpectedClientError("body read failed");

    expect(isTransportIndeterminate(wrapped, undefined)).toBe(true);
  });

  // A fetcher failure the SDK does not recognize as a connection error is a
  // different, equally real shape: it carries no status and stays a single
  // attempt.
  test("does not retry an unrecognized fetcher failure", async () => {
    const fetcher = vi.fn(async () => {
      throw new TypeError("network unavailable");
    });
    await expect(
      client(fetcher).track(null, {
        featureId: "messages",
        operationId: "network",
      })
    ).rejects.toMatchObject({ name: "UnexpectedClientError" });
    expect(fetcher).toHaveBeenCalledOnce();
  });

  test("does not retry timeouts", async () => {
    const fetcher = vi.fn(async (input: RequestInfo | URL) => {
      const request = new Request(input);
      return await new Promise<Response>((_resolve, reject) => {
        request.signal.addEventListener(
          "abort",
          () => reject(request.signal.reason),
          { once: true }
        );
      });
    });
    const autumn = new Autumn({} as never, {
      secretKey: "test-secret-key",
      serverURL: "https://example.test",
      operationNamespace: "namespace-1",
      timeoutMs: 5,
      identify: async () => ({ customerId: "customer-1" }),
      fetcher,
    });
    await expect(
      autumn.track(null, { featureId: "messages", operationId: "timeout" })
    ).rejects.toMatchObject({ name: "RequestTimeoutError" });
    expect(fetcher).toHaveBeenCalledOnce();
  });

  test("does not retry aborts", async () => {
    const fetcher = vi.fn(async () => {
      throw new DOMException("aborted", "AbortError");
    });
    await expect(
      client(fetcher).track(null, {
        featureId: "messages",
        operationId: "abort",
      })
    ).rejects.toMatchObject({ name: "RequestAbortedError" });
    expect(fetcher).toHaveBeenCalledOnce();
  });

  test("allows only read-only fields from structurally compatible check args", async () => {
    const args = {
      featureId: "messages",
      entityId: "workspace-1",
      requiredBalance: 2,
      properties: { source: "runtime" },
      withPreview: true,
      sendEvent: true,
    };

    const request = await capture((autumn) => autumn.check(null, args));

    expect(request.body).toEqual({
      customer_id: "customer-1",
      feature_id: "messages",
      entity_id: "workspace-1",
      required_balance: 2,
      properties: { source: "runtime" },
      with_preview: true,
    });
    expect(request.body).not.toHaveProperty("send_event");
  });

  test("separates the read-only check from the consuming one", async () => {
    const requests: Request[] = [];
    const fetcher = async (input: RequestInfo | URL) => {
      requests.push(new Request(input));
      return response({ message: "rejected" }, 400);
    };
    const autumn = client(fetcher);

    await autumn.check(null, { featureId: "messages" }).catch(() => undefined);
    await autumn
      .consumeCheck(null, { featureId: "messages", operationId: "consume" })
      .catch(() => undefined);

    const [read, consume] = requests as [Request, Request];
    expect(read.headers.get("idempotency-key")).toBeNull();
    expect(await read.text()).not.toContain("send_event");
    expect(consume.headers.get("idempotency-key")).toMatch(/^autumn-1-/);
    expect(await consume.text()).toContain('"send_event":true');
  });

  test.each(VALID_BALANCE_UPDATES)(
    "sends the %s update once in the provider shape",
    async (name, fields, expectedFields) => {
      const requests: Request[] = [];
      const fetcher = vi.fn(async (input: RequestInfo | URL) => {
        requests.push(new Request(input));
        return response({ success: true });
      });

      const operationId = `balance-${name.replaceAll(" ", "-")}`;
      await expect(
        client(fetcher).balances.update(null, {
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
          operationNamespace: "namespace-1",
          operationId,
        })
      );
      expect(await request.json()).toEqual({
        customer_id: "customer-1",
        feature_id: "api_calls",
        ...expectedFields,
      });
    }
  );

  test.each(INVALID_BALANCE_UPDATES)(
    "rejects %s before balance update transport",
    async (name, fields) => {
      const fetcher = vi.fn();

      await expect(
        client(fetcher).balances.update(null, {
          featureId: "api_calls",
          ...fields,
          operationId: `invalid-${name.replaceAll(" ", "-")}`,
        })
      ).rejects.toThrow("at most one");
      expect(fetcher).not.toHaveBeenCalled();
    }
  );

  test("enforces relational constraints before transport", async () => {
    const fetcher = vi.fn();
    const autumn = client(fetcher);
    await expect(
      autumn.track(null, {
        featureId: "messages",
        eventName: "message.sent",
        operationId: "invalid-track",
      })
    ).rejects.toThrow("exactly one");
    expect(fetcher).not.toHaveBeenCalled();
  });
});
