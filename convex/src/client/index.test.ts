import { AutumnError } from "autumn-js";
import { describe, expect, test, vi } from "vitest";
import { Autumn, AutumnIndeterminateError } from "./index.js";

type CapturedRequest = {
  method: string;
  path: string;
  headers: Headers;
  body: Record<string, unknown>;
};

function response(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function client(fetcher: typeof fetch, customerId = "customer-1") {
  return new Autumn({} as never, {
    secretKey: "test-secret-key",
    serverURL: "https://example.test",
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
          identify: async () => ({ customerId: "customer-1" }),
          headers: { [header]: "override" },
        })
    ).toThrow("managed by @useautumn/convex");
  });

  test("namespaces operation keys by route, customer and payload", async () => {
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

    expect(new Set(keys).size).toBe(4);
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
        expected: { customer_id: "customer-1", plans: [{ plan_id: "p" }] },
      },
      {
        name: "previewUpdate",
        path: "/v1/billing.preview_update",
        execute: (a) => a.billing.previewUpdate(null, { planId: "p" }),
        expected: { customer_id: "customer-1", plan_id: "p" },
      },
      {
        name: "update",
        path: "/v1/billing.update",
        execute: (a) =>
          a.billing.update(null, { planId: "p", operationId: "op" }),
        expected: { customer_id: "customer-1", plan_id: "p" },
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
          a.billing.portal(null, { returnUrl: "https://app.test" }),
        expected: { customer_id: "customer-1", return_url: "https://app.test" },
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
      expect(request.body, item.name).toMatchObject(item.expected);
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

  test.each([409, 500, 503])("does not retry HTTP %s", async (status) => {
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

  test("does not retry network failures", async () => {
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
    await expect(
      autumn.balances.update(null, {
        featureId: "messages",
        remaining: 1,
        usage: 1,
        operationId: "invalid-balance",
      })
    ).rejects.toThrow("exactly one");
    expect(fetcher).not.toHaveBeenCalled();
  });
});
