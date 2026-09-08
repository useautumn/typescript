/// <reference types="vite/client" />

import { afterEach, describe, expect, test, vi } from "vitest";
import { defineSchema, makeFunctionReference } from "convex/server";
import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
  FunctionReturnType,
} from "convex/server";
import type { Autumn as AutumnSDK } from "autumn-js";
import * as autumnActions from "./actions.fixture.js";
import { deriveProviderKey } from "../idempotency.js";
import { initConvexTest, response } from "./setup.test.js";

/**
 * Every public action, with arguments that reach transport, and the single
 * Autumn route it is allowed to call.
 */
const ALLOWLISTED_PUBLIC_ROUTES: Array<
  [string, Record<string, unknown>, string]
> = [
  ["check", { featureId: "messages" }, "/v1/balances.check"],
  ["previewAttach", { planId: "pro" }, "/v1/billing.preview_attach"],
  [
    "previewMultiAttach",
    { plans: [{ planId: "pro" }] },
    "/v1/billing.preview_multi_attach",
  ],
  ["previewUpdate", { planId: "pro" }, "/v1/billing.preview_update"],
  [
    "previewMultiUpdate",
    { updates: [{ planId: "pro", cancelAction: "cancel_immediately" }] },
    "/v1/billing.preview_multi_update",
  ],
  ["getCustomer", {}, "/v1/customers.get"],
  ["getEntity", { entityId: "seat-1" }, "/v1/entities.get"],
  ["listEntities", {}, "/v1/entities.list"],
  ["getPlan", { planId: "pro" }, "/v1/plans.get"],
  ["listPlans", {}, "/v1/plans.list"],
  ["listEvents", {}, "/v1/events.list"],
  [
    "aggregateEvents",
    { featureId: "messages", range: "24h" },
    "/v1/events.aggregate",
  ],
];

/** Billing controls that public validators must reject before transport. */
const PUBLIC_OPERATOR_CONTROLS: Array<[string, Record<string, unknown>]> = [
  [
    "previewAttach",
    {
      planId: "pro",
      invoiceMode: { enabled: true, enablePlanImmediately: true },
      noBillingChanges: true,
      enablePlanImmediately: true,
    },
  ],
  [
    "previewMultiAttach",
    {
      plans: [{ planId: "pro" }],
      invoiceMode: { enabled: true, enablePlanImmediately: true },
      enablePlanImmediately: true,
    },
  ],
  [
    "previewUpdate",
    {
      planId: "pro",
      invoiceMode: { enabled: true, enablePlanImmediately: true },
      noBillingChanges: true,
      refundLastPayment: "full",
      subscriptionParams: { payment_behavior: "pending_if_incomplete" },
      recalculateBalances: { enabled: false },
      carryOverUsages: { enabled: true, featureIds: ["messages"] },
    },
  ],
  [
    "previewMultiUpdate",
    {
      updates: [{ planId: "pro", cancelAction: "cancel_immediately" }],
      refundLastPayment: "full",
      subscriptionParams: { payment_behavior: "pending_if_incomplete" },
    },
  ],
];

/**
 * Every internal provider mutation, with arguments that reach transport, the
 * single Autumn route it is allowed to call and the operation label its
 * idempotency key is derived from. The trusted `customerId` each requires is
 * added at the call site.
 */
const PROVIDER_MUTATIONS: Array<
  [string, Record<string, unknown>, string, string]
> = [
  ["consumeCheck", { featureId: "messages" }, "/v1/balances.check", "check"],
  ["track", { featureId: "messages" }, "/v1/balances.track", "track"],
  ["attach", { planId: "pro" }, "/v1/billing.attach", "billing.attach"],
  [
    "multiAttach",
    { plans: [{ planId: "pro" }] },
    "/v1/billing.multi_attach",
    "billing.multiAttach",
  ],
  [
    "updateSubscription",
    { planId: "pro" },
    "/v1/billing.update",
    "billing.update",
  ],
  [
    "multiUpdate",
    { updates: [{ planId: "pro", cancelAction: "cancel_immediately" }] },
    "/v1/billing.multi_update",
    "billing.multiUpdate",
  ],
  [
    "setupPayment",
    { planId: "pro" },
    "/v1/billing.setup_payment",
    "billing.setupPayment",
  ],
  [
    "getOrCreateCustomer",
    {},
    "/v1/customers.get_or_create",
    "customers.getOrCreate",
  ],
  [
    "updateCustomer",
    { name: "Ada" },
    "/v1/customers.update",
    "customers.update",
  ],
  ["deleteCustomer", {}, "/v1/customers.delete", "customers.delete"],
  [
    "createEntity",
    { entityId: "seat-1", featureId: "seats" },
    "/v1/entities.create",
    "entities.create",
  ],
  [
    "updateEntity",
    { entityId: "seat-1", billingControls: {} },
    "/v1/entities.update",
    "entities.update",
  ],
  [
    "deleteEntity",
    { entityId: "seat-1" },
    "/v1/entities.delete",
    "entities.delete",
  ],
  [
    "updateBalance",
    { featureId: "messages", addToBalance: 1 },
    "/v1/balances.update",
    "balances.update",
  ],
  [
    "createReferralCode",
    { programId: "friends" },
    "/v1/referrals.create_code",
    "referrals.create",
  ],
  [
    "redeemReferralCode",
    { code: "code-1" },
    "/v1/referrals.redeem_code",
    "referrals.redeem",
  ],
];

const publicActionNames = ALLOWLISTED_PUBLIC_ROUTES.map(([name]) => name);
const internalMutationNames = PROVIDER_MUTATIONS.map(([name]) => name);
const CUSTOMER_ID = "customer-1";

type Registration = {
  isAction?: boolean;
  isPublic?: boolean;
  isInternal?: boolean;
};

function registration(name: string): Registration {
  return autumnActions[
    name as keyof typeof autumnActions
  ] as unknown as Registration;
}

type Assert<T extends true> = T;
type Equal<Left, Right> = [Left] extends [Right]
  ? [Right] extends [Left]
    ? true
    : false
  : false;

type AutumnApi = ApiFromModules<{ autumn: typeof autumnActions }>["autumn"];
type PublicApi = FilterApi<AutumnApi, FunctionReference<any, "public">>;
type InternalApi = FilterApi<AutumnApi, FunctionReference<any, "internal">>;
type ProviderMutation =
  | "consumeCheck"
  | "track"
  | "attach"
  | "multiAttach"
  | "updateSubscription"
  | "multiUpdate"
  | "setupPayment"
  | "getOrCreateCustomer"
  | "updateCustomer"
  | "deleteCustomer"
  | "createEntity"
  | "updateEntity"
  | "deleteEntity"
  | "updateBalance"
  | "createReferralCode"
  | "redeemReferralCode";

type _MutationsAreInternal = Assert<
  Equal<Exclude<ProviderMutation, keyof InternalApi>, never>
>;
type _MutationsAreNotPublic = Assert<
  Equal<Extract<keyof PublicApi, ProviderMutation>, never>
>;
type _BillingPortalIsNotPublic = Assert<
  Equal<Extract<keyof PublicApi, "billingPortal">, never>
>;
type _PublicApiContainsOnlyAllowlistedActions = Assert<
  Equal<
    keyof PublicApi,
    | "check"
    | "previewAttach"
    | "previewMultiAttach"
    | "previewUpdate"
    | "previewMultiUpdate"
    | "getCustomer"
    | "getEntity"
    | "listEntities"
    | "getPlan"
    | "listPlans"
    | "listEvents"
    | "aggregateEvents"
  >
>;

/** The public check argument type carries no field that can consume balance. */
type PublicCheckArgs =
  AutumnApi["check"] extends FunctionReference<"action", "public", infer Args>
    ? Args
    : never;
type _PublicCheckRejectsSendEvent = Assert<
  Equal<Extract<keyof PublicCheckArgs, "sendEvent" | "operationId">, never>
>;

/**
 * A public action resolves its customer through `identify(ctx)`, so none of
 * them accepts a customer ID from the client. Every internal action requires
 * one instead, because scheduled work has no original user auth to derive it
 * from and its trusted caller supplies it in every case.
 */
type ActionArgs<Reference> =
  Reference extends FunctionReference<"action", any, infer Args> ? Args : never;
type AcceptsCustomerId<Args> = Args extends unknown
  ? "customerId" extends keyof Args
    ? true
    : false
  : never;
type RequiresCustomerId<Args> = Args extends unknown
  ? Args extends { customerId: string }
    ? true
    : false
  : never;

type _PublicAttachRejectsOperatorControls = Assert<
  Equal<
    Extract<
      keyof ActionArgs<PublicApi["previewAttach"]>,
      "invoiceMode" | "noBillingChanges" | "enablePlanImmediately"
    >,
    never
  >
>;
type _PublicMultiAttachRejectsOperatorControls = Assert<
  Equal<
    Extract<
      keyof ActionArgs<PublicApi["previewMultiAttach"]>,
      "invoiceMode" | "enablePlanImmediately"
    >,
    never
  >
>;
type _PublicUpdateRejectsOperatorControls = Assert<
  Equal<
    Extract<
      keyof ActionArgs<PublicApi["previewUpdate"]>,
      | "invoiceMode"
      | "noBillingChanges"
      | "refundLastPayment"
      | "subscriptionParams"
      | "recalculateBalances"
      | "carryOverUsages"
    >,
    never
  >
>;
type _PublicMultiUpdateRejectsOperatorControls = Assert<
  Equal<
    Extract<
      keyof ActionArgs<PublicApi["previewMultiUpdate"]>,
      "refundLastPayment" | "subscriptionParams"
    >,
    never
  >
>;
type _PublicActionsRejectCustomerId = Assert<
  Equal<AcceptsCustomerId<ActionArgs<PublicApi[keyof PublicApi]>>, false>
>;
type _InternalActionsRequireCustomerId = Assert<
  Equal<RequiresCustomerId<ActionArgs<InternalApi[ProviderMutation]>>, true>
>;

type _CheckResult = Assert<
  Equal<
    FunctionReturnType<AutumnApi["check"]>,
    Awaited<ReturnType<AutumnSDK["check"]>>
  >
>;
type _GetCustomerResult = Assert<
  Equal<
    FunctionReturnType<AutumnApi["getCustomer"]>,
    Awaited<ReturnType<AutumnSDK["customers"]["get"]>>
  >
>;
type _AttachResult = Assert<
  Equal<
    FunctionReturnType<AutumnApi["attach"]>,
    Awaited<ReturnType<AutumnSDK["billing"]["attach"]>>
  >
>;
type _UpdateBalanceResult = Assert<
  Equal<
    FunctionReturnType<AutumnApi["updateBalance"]>,
    Awaited<ReturnType<AutumnSDK["balances"]["update"]>>
  >
>;

/** A caller reads the native result fields without narrowing or asserting. */
function readCheckResult(result: FunctionReturnType<AutumnApi["check"]>): {
  allowed: boolean;
  customerId: string;
} {
  return { allowed: result.allowed, customerId: result.customerId };
}

async function captureRequest(
  name: string,
  args: Record<string, unknown>
): Promise<Request> {
  const requests: Request[] = [];
  vi.stubGlobal("fetch", async (input: RequestInfo | URL) => {
    requests.push(new Request(input));
    return response({ message: "rejected" }, 400);
  });
  const t = initConvexTest(defineSchema({}));
  const action = makeFunctionReference<"action", Record<string, unknown>>(
    `actions.fixture:${name}`
  );

  await t.action(action, args).catch(() => undefined);

  expect(requests, name).toHaveLength(1);
  return requests[0]!;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("generated action surface", () => {
  test("classifies every generated action exactly once", () => {
    expect(publicActionNames).toHaveLength(12);
    expect(internalMutationNames).toHaveLength(16);
    expect(new Set(Object.keys(autumnActions))).toEqual(
      new Set([...publicActionNames, ...internalMutationNames])
    );
  });

  test("does not publish a generic billing portal action", () => {
    expect(autumnActions).not.toHaveProperty("billingPortal");
  });

  test.each(internalMutationNames)(
    "registers %s so a Convex client cannot call it",
    (name) => {
      expect(registration(name).isAction).toBe(true);
      expect(registration(name).isInternal).toBe(true);
      expect(registration(name).isPublic).toBeUndefined();
    }
  );

  test.each(publicActionNames)("registers %s as a public action", (name) => {
    expect(registration(name).isAction).toBe(true);
    expect(registration(name).isPublic).toBe(true);
    expect(registration(name).isInternal).toBeUndefined();
  });

  test("keeps the native result shape reachable without an assertion", () => {
    expect(
      readCheckResult({
        allowed: true,
        customerId: "customer-1",
        balance: null,
        flag: null,
      })
    ).toEqual({ allowed: true, customerId: "customer-1" });
  });
});

describe("public action security boundary", () => {
  test.each(ALLOWLISTED_PUBLIC_ROUTES)(
    "%s reaches only its allowlisted public Autumn route",
    async (name, args, path) => {
      const request = await captureRequest(name, args);

      expect(new URL(request.url).pathname).toBe(path);
      // Provider mutation routes are reserved for keyed internal actions. The
      // public allowlist cannot select one.
      expect(request.headers.get("idempotency-key")).toBeNull();
    }
  );

  test.each(PUBLIC_OPERATOR_CONTROLS)(
    "%s rejects billing operator controls before transport",
    async (name, args) => {
      const fetcher = vi.fn();
      vi.stubGlobal("fetch", fetcher);
      const t = initConvexTest(defineSchema({}));
      const action = makeFunctionReference<"action", Record<string, unknown>>(
        `actions.fixture:${name}`
      );

      await expect(t.action(action, args)).rejects.toThrow();
      expect(fetcher).not.toHaveBeenCalled();
    }
  );

  test.each(PROVIDER_MUTATIONS)(
    "%s reaches its own keyed provider mutation route reserved for internal actions",
    async (name, args, path, operation) => {
      const operationId = `classification-${name}`;
      const request = await captureRequest(name, {
        ...args,
        customerId: CUSTOMER_ID,
        operationId,
      });

      expect(new URL(request.url).pathname).toBe(path);
      // The key is derived from the operation label rather than the route, so a
      // mutation carrying another mutation's label keys its operation as that
      // one: at Autumn the two suppress each other inside the duplicate window,
      // and the caller is told a mutation it never made was already applied.
      expect(request.headers.get("idempotency-key")).toBe(
        await deriveProviderKey({
          operation,
          operationNamespace: "actions-fixture",
          customerId: CUSTOMER_ID,
          operationId,
        })
      );
    }
  );

  test.each(PROVIDER_MUTATIONS)(
    "%s keeps operation identity out of the Autumn request",
    async (name, args) => {
      const operationId = `identity-${name}`;
      const request = await captureRequest(name, {
        ...args,
        customerId: CUSTOMER_ID,
        operationId,
      });
      const body = await request.clone().text();

      // The operation ID identifies the operation and never describes it, and
      // the trusted customer reaches Autumn only as the request's subject.
      expect(body).not.toContain(operationId);
      expect(body).not.toContain("operation_id");
      expect(body).not.toContain("operationId");
      expect(JSON.parse(body)).toMatchObject({ customer_id: CUSTOMER_ID });
      expect(request.headers.get("idempotency-key")).not.toContain(operationId);
    }
  );

  test.each(PROVIDER_MUTATIONS)(
    "%s refuses to run without a customer from its caller",
    async (name, args) => {
      const fetcher = vi.fn();
      vi.stubGlobal("fetch", fetcher);
      const t = initConvexTest(defineSchema({}));
      const action = makeFunctionReference<"action", Record<string, unknown>>(
        `actions.fixture:${name}`
      );

      await expect(
        t.action(action, { ...args, operationId: `identity-${name}` })
      ).rejects.toThrow("customerId");
      expect(fetcher).not.toHaveBeenCalled();
    }
  );

  test("public check cannot send_event and internal consumeCheck can", async () => {
    const publicBody = await (
      await captureRequest("check", { featureId: "messages" })
    ).text();
    vi.unstubAllGlobals();
    const internalBody = await (
      await captureRequest("consumeCheck", {
        customerId: CUSTOMER_ID,
        featureId: "messages",
        operationId: "consume-1",
      })
    ).text();

    expect(JSON.parse(publicBody)).not.toHaveProperty("send_event");
    expect(JSON.parse(internalBody)).toMatchObject({ send_event: true });
  });
});
