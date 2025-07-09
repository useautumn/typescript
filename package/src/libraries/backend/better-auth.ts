import { createAuthEndpoint } from "better-auth/plugins";
import {
  type AuthContext,
  type BetterAuthClientPlugin,
  type BetterAuthPlugin,
  type EndpointContext,
} from "better-auth";
import { APIError } from "better-call";
import { createRouterWithOptions } from "./routes/backendRouter";
import { secretKeyCheck } from "./utils/secretKeyCheck";
import { Autumn } from "@sdk";
import { findRoute } from "rou3";
import { sessionMiddleware } from "better-auth/api";
import { z } from "zod";

import {
  AttachParamsSchema,
  TrackParamsSchema,
  CancelParamsSchema,
  CheckParamsSchema,
} from "@/client/types/clientGenTypes";
import {
  CreateReferralCodeParamsSchema,
  RedeemReferralCodeParamsSchema,
} from "@/client/types/clientReferralTypes";
import { toSnakeCase } from "@/utils/toSnakeCase";

const router = createRouterWithOptions();

const betterAuthPathMap: Record<string, string> = {
  "create-customer": "customers",
  "customers/get": "customers",
  attach: "attach",
  check: "check",
  track: "track",
  cancel: "cancel",
  "referrals/redeem-code": "referrals/redeem",
  "referrals/create-code": "referrals/code",
  "open-billing-portal": "billing_portal",
  "products/list": "products",
};

const handleReq = async ({
  ctx,
  client,
}: {
  ctx: EndpointContext<any, any, AuthContext>;
  client: Autumn;
}) => {
  let { found, error: resError } = secretKeyCheck();
  if (!found) {
    return ctx.json({ error: resError }, { status: resError!.statusCode });
  }

  const req = ctx.request as Request;
  const method = req.method;
  const url = new URL(req.url);
  const searchParams = Object.fromEntries(url.searchParams);
  let pathname = url.pathname;
  pathname = pathname.replace("/api/auth", "/api");
  const rest = pathname.split("/api/autumn/")[1];
  pathname = `/api/autumn/${betterAuthPathMap[rest] || rest}`;

  const match = findRoute(router, method, pathname);

  if (!match) {
    return ctx.json({ error: "Not found" }, { status: 404 });
  }

  const { data, params: pathParams } = match;
  const { handler } = data;

  const body = toSnakeCase(ctx.body, ["checkoutSessionParams"]);
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
    path: url,
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

export const autumn = (options?: { client?: Autumn }) => {
  const client = options?.client ?? new Autumn();
  return {
    id: "autumn",
    endpoints: {
      createCustomer: createAuthEndpoint(
        "/autumn/create-customer",
        {
          method: "POST",
          use: [sessionMiddleware],
        },
        async (ctx) => {
          return await handleReq({ ctx, client });
        }
      ),
      listProducts: createAuthEndpoint(
        "/autumn/products/list",
        {
          method: "GET",
          use: [sessionMiddleware],
        },
        async (ctx) => {
          return await handleReq({ ctx, client });
        }
      ),
      attach: createAuthEndpoint(
        "/autumn/attach",
        {
          method: "POST",
          body: AttachParamsSchema.omit({
            dialog: true,
            openInNewTab: true,
          }),
          use: [sessionMiddleware],
        },
        async (ctx) => handleReq({ ctx, client })
      ),

      check: createAuthEndpoint(
        "/autumn/check",
        {
          method: "POST",
          body: CheckParamsSchema.omit({
            dialog: true,
          }),
          use: [sessionMiddleware],
        },
        async (ctx) => handleReq({ ctx, client })
      ),
      track: createAuthEndpoint(
        "/autumn/track",
        {
          method: "POST",
          body: TrackParamsSchema,
          use: [sessionMiddleware],
        },
        async (ctx) => handleReq({ ctx, client })
      ),
      cancel: createAuthEndpoint(
        "/autumn/cancel",
        {
          method: "POST",
          body: CancelParamsSchema,
          use: [sessionMiddleware],
        },
        async (ctx) => {
          return await handleReq({ ctx, client });
        }
      ),
      createReferralCode: createAuthEndpoint(
        "/autumn/referrals/create-code",
        {
          method: "POST",
          body: CreateReferralCodeParamsSchema,
          use: [sessionMiddleware],
        },
        async (ctx) => {
          return await handleReq({ ctx, client });
        }
      ),
      redeemReferralCode: createAuthEndpoint(
        "/autumn/referrals/redeem-code",
        {
          method: "POST",
          body: RedeemReferralCodeParamsSchema,
          use: [sessionMiddleware],
        },
        async (ctx) => {
          return await handleReq({ ctx, client });
        }
      ),
      allowed: createAuthEndpoint(
        "/autumn/allowed",
        {
          method: "POST",
          metadata: {
            isAction: false,
          },
          body: z.object({
            featureId: z.string().optional(),
            productId: z.string().optional(),
            requiredBalance: z.number().optional(),
          }),
          use: [sessionMiddleware],
        },
        async (ctx) => {}
      ),

      openBillingPortal: createAuthEndpoint(
        "/autumn/open-billing-portal",
        {
          method: "POST",
          body: z
            .object({
              returnUrl: z.string().optional(),
            })
            .optional(),
          metadata: {
            isAction: false,
          },
          use: [sessionMiddleware],
        },
        async (ctx) => await handleReq({ ctx, client })
      ),
    },
  } satisfies BetterAuthPlugin;
};

export const autumnClient = () =>
  ({
    id: "autumn",
    $InferServerPlugin: {} as ReturnType<typeof autumn>,
  }) satisfies BetterAuthClientPlugin;
