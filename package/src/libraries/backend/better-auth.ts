import { createAuthEndpoint } from "better-auth/plugins";
import {
  type AuthContext,
  type BetterAuthClientPlugin,
  type BetterAuthPlugin,
  type EndpointContext,
} from "better-auth";
import { APIError, createEndpoint } from "better-call";
import { createRouterWithOptions } from "./routes/backendRouter";
import { secretKeyCheck } from "./utils/secretKeyCheck";
import { BillingPortalParamsSchema, CustomerExpandEnum } from "@sdk";
import { Autumn } from "../../sdk/client";
import { findRoute } from "rou3";
import { sessionMiddleware } from "better-auth/api";
import { z } from "zod";

import {
  AttachParamsSchema,
  TrackParamsSchema,
  CancelParamsSchema,
  CheckParamsSchema,
} from "@sdk/general/genTypes";
import {
  CreateReferralCodeParamsSchema,
  RedeemReferralCodeParamsSchema,
} from "@sdk/referrals/referralTypes";

const router = createRouterWithOptions();

const betterAuthPathMap: Record<string, string> = {
  // "create-customer": "customers",
  // "customers/get": "customers",
  attach: "attach",
  check: "check",
  track: "track",
  cancel: "cancel",
  "referrals/redeem-code": "referrals/redeem",
  "referrals/create-code": "referrals/code",
  "open-billing-portal": "billing_portal",
  // "products/list": "products",
};

const handleReq = async ({
  ctx,
  options,
  method,
}: {
  ctx: EndpointContext<any, any, AuthContext>;
  options?: { url?: string; secretKey?: string };
  method: string;
}) => {
  let { found, error: resError } = secretKeyCheck();

  if (!found && !options?.secretKey) {
    throw new APIError(resError!.statusCode as any, {
      message: resError!.message,
      code: resError!.code,
    });
  }

  const client = new Autumn({
    url: options?.url,
    secretKey: options?.secretKey,
  });

  let searchParams: Record<string, string> = {};
  try {
    const req = ctx.request as Request;
    const url = new URL(req.url);
    searchParams = Object.fromEntries(url.searchParams);
  } catch (error) {}

  const rest = ctx.path.split("/autumn/")[1];
  const pathname = `/api/autumn/${betterAuthPathMap[rest] || rest}`;

  const match = findRoute(router, method, pathname);

  if (!match) {
    return ctx.json({ error: "Not found" }, { status: 404 });
  }

  const { data, params: pathParams } = match;
  const { handler } = data;

  // const body = toSnakeCase(ctx.body, ["checkoutSessionParams"]);
  const body = ctx.body;
  const session = ctx.context.session;

  const identify = async () => {
    if (!session) {
      return;
    }
    return {
      customerId: session.user.id,
      customerData: {
        email: session.user.email,
        name: session.user.name,
      },
    };
  };

  const result = await handler({
    autumn: client,
    body,
    path: pathname,
    getCustomer: identify,
    pathParams,
    searchParams,
  });

  if (result.statusCode >= 400) {
    throw new APIError(result.statusCode, {
      message: result.body.message,
      code: result.body.code,
    });
  }

  return ctx.json(result.body, { status: result.statusCode });
};

export const autumn = (options?: { url?: string; secretKey?: string }) => {
  // let client = options?.url ? new Autumn({ url: options.url }) : undefined;
  let secretKey = options?.secretKey;
  let url = options?.url;

  return {
    id: "autumn",
    endpoints: {
      createCustomer: createEndpoint(
        "/autumn/customers",
        {
          method: "POST",
          use: [sessionMiddleware],
          body: z.object({
            expand: z.array(CustomerExpandEnum).optional(),
          }),
          metadata: {
            isAction: false,
          },
        },
        async (ctx) => {
          return await handleReq({ ctx, options, method: "POST" });
        }
      ),
      listProducts: createAuthEndpoint(
        "/autumn/products",
        {
          method: "GET",
          use: [sessionMiddleware],
        },
        async (ctx) => {
          return await handleReq({ ctx, options, method: "GET" });
        }
      ),
      attach: createAuthEndpoint(
        "/autumn/attach",
        {
          method: "POST",
          body: AttachParamsSchema.omit({
            customer_id: true,
          }),
          use: [sessionMiddleware],
        },
        async (ctx) => handleReq({ ctx, options, method: "POST" })
      ),

      check: createAuthEndpoint(
        "/autumn/check",
        {
          method: "POST",
          body: CheckParamsSchema.omit({
            customer_id: true,
          }),
          use: [sessionMiddleware],
        },
        async (ctx) => handleReq({ ctx, options, method: "POST" })
      ),
      track: createAuthEndpoint(
        "/autumn/track",
        {
          method: "POST",
          body: TrackParamsSchema.omit({
            customer_id: true,
          }),
          use: [sessionMiddleware],
        },
        async (ctx) => handleReq({ ctx, options, method: "POST" })
      ),
      cancel: createAuthEndpoint(
        "/autumn/cancel",
        {
          method: "POST",
          body: CancelParamsSchema.omit({
            customer_id: true,
          }),
          use: [sessionMiddleware],
        },
        async (ctx) => {
          return await handleReq({ ctx, options, method: "POST" });
        }
      ),
      createReferralCode: createAuthEndpoint(
        "/autumn/referrals/create-code",
        {
          method: "POST",
          body: CreateReferralCodeParamsSchema.omit({
            customer_id: true,
          }),
          use: [sessionMiddleware],
        },
        async (ctx) => {
          return await handleReq({ ctx, options, method: "POST" });
        }
      ),
      redeemReferralCode: createAuthEndpoint(
        "/autumn/referrals/redeem-code",
        {
          method: "POST",
          body: RedeemReferralCodeParamsSchema.omit({
            customer_id: true,
          }),
          use: [sessionMiddleware],
        },
        async (ctx) => {
          return await handleReq({ ctx, options, method: "POST" });
        }
      ),

      billingPortal: createAuthEndpoint(
        "/autumn/billing_portal",
        {
          method: "POST",
          body: BillingPortalParamsSchema,
          metadata: {
            isAction: false,
          },
          use: [sessionMiddleware],
        },
        async (ctx) => await handleReq({ ctx, options, method: "POST" })
      ),
    },
  } satisfies BetterAuthPlugin;
};

export const autumnClient = () =>
  ({
    id: "autumn",
    $InferServerPlugin: {} as ReturnType<typeof autumn>,
  }) satisfies BetterAuthClientPlugin;
