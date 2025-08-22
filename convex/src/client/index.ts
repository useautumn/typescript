import {
  actionGeneric,
  mutationGeneric,
  queryGeneric,
  httpActionGeneric,
} from "convex/server";
import type {
  ActionBuilder,
  FunctionVisibility,
  HttpRouter,
  GenericActionCtx,
  FunctionReference,
  RegisteredAction,
  FunctionHandle,
} from "convex/server";
import { ROUTABLE_HTTP_METHODS } from "convex/server";
import { corsRouter } from "convex-helpers/server/cors";
import { JSONValue, v } from "convex/values";
import type { Mounts } from "../component/_generated/api.js";
import type {
  UseApi,
  RunMutationCtx,
  RunQueryCtx,
  RunActionCtx,
} from "./types.js";
import {
  type TrackArgsType,
  AttachArgs,
  AttachArgsType,
  CheckArgs,
  CheckArgsType,
  CheckoutArgs,
  CheckoutArgsType,
  TrackArgs,
  UserTrackArgs,
  UserCheckArgs,
  UserAttachArgs,
  UserCheckoutArgs,
  CreateEntityArgs,
  CreateEntityArgsType,
  UserCreateEntityArgsType,
  UserCreateEntityArgs,
  DeleteEntityArgsType,
  DeleteEntityArgs,
  GetCustomerArgsType,
  UpdateCustomerArgsType,
  DeleteCustomerArgsType,
  BillingPortalArgsType,
  GetProductArgsType,
  ListProductsArgsType,
  CreateReferralCodeArgsType,
  RedeemReferralCodeArgsType,
  UsageArgs,
  UsageArgsType,
  QueryArgs,
  QueryArgsType,
  CancelArgs,
  CancelArgsType,
  SetupPaymentArgs,
  SetupPaymentArgsType,
  GetEntityArgsType,
} from "../types.js";
import type { AutumnAPI } from "../react/hooks/index.js";
import { convexHandler } from "autumn-js/convex";

// UseApi<typeof api> is an alternative that has jump-to-definition but is
// less stable and reliant on types within the component files, which can cause
// issues where passing `components.foo` doesn't match the argument
export type AutumnComponent = UseApi<Mounts>;

export class Autumn {
  constructor(
    public component: AutumnComponent,
    public options: {
      identify: any;
      apiKey: string;
      url?: string;
    }
  ) {}

  // Direct utility method for fetching customer (kept for backwards compatibility)
  async directCustomer(ctx: RunActionCtx) {
    let identifierOpts = await this.options.identify(ctx, {});
    if (!identifierOpts) {
      throw new Error("No customer identifier found for Autumn.identify()");
    }

    console.log("identifierOpts", identifierOpts);

    return ctx.runAction((this.component.lib as any).fetchCustomer, {
      customerId: identifierOpts.customerId,
      customerData: identifierOpts.customerData,
      apiKey: this.options.apiKey,
    });
  }

  /**
   * Utility to re-export actions with automatic customer identification.
   * Example usage:
   *   autumn.api().foo({ ...args })
   */
  api() {
    return {
      // Core tracking and checking methods
      track: actionGeneric({
        args: UserTrackArgs,
        handler: async (ctx, args) => {
          const identifierOpts = await this.options.identify(ctx, {});
          if (!identifierOpts) {
            throw new Error(
              "No customer identifier found for Autumn.identify()"
            );
          }

          const trackArgs: TrackArgsType = {
            ...args,
            customerId: identifierOpts.customerId,
            customerData: identifierOpts.customerData,
            apiKey: this.options.apiKey,
          };

          return await ctx.runAction(this.component.lib.track, trackArgs);
        },
      }),

      check: actionGeneric({
        args: UserCheckArgs,
        handler: async (ctx, args) => {
          const identifierOpts = await this.options.identify(ctx, {});
          if (!identifierOpts) {
            throw new Error(
              "No customer identifier found for Autumn.identify()"
            );
          }

          const checkArgs: CheckArgsType = {
            ...args,
            customerId: identifierOpts.customerId,
            customerData: identifierOpts.customerData,
            apiKey: this.options.apiKey,
          };

          return await ctx.runAction(this.component.lib.check, checkArgs);
        },
      }),

      // Product attachment and checkout
      attach: actionGeneric({
        args: UserAttachArgs,
        handler: async (ctx, args) => {
          const identifierOpts = await this.options.identify(ctx, {});
          if (!identifierOpts) {
            throw new Error(
              "No customer identifier found for Autumn.identify()"
            );
          }

          const attachArgs: AttachArgsType = {
            ...args,
            customerId: identifierOpts.customerId,
            customerData: identifierOpts.customerData,
            apiKey: this.options.apiKey,
          };

          return await ctx.runAction(this.component.lib.attach, attachArgs);
        },
      }),

      checkout: actionGeneric({
        args: UserCheckoutArgs,
        handler: async (ctx, args) => {
          const identifierOpts = await this.options.identify(ctx, {});
          if (!identifierOpts) {
            throw new Error(
              "No customer identifier found for Autumn.identify()"
            );
          }

          const checkoutArgs: CheckoutArgsType = {
            ...args,
            customerId: identifierOpts.customerId,
            customerData: identifierOpts.customerData,
            apiKey: this.options.apiKey,
          };

          return await ctx.runAction(this.component.lib.checkout, checkoutArgs);
        },
      }),

      // Entity management
      createEntity: actionGeneric({
        args: UserCreateEntityArgs,
        handler: async (ctx, args) => {
          const identifierOpts = await this.options.identify(ctx, {});
          if (!identifierOpts) {
            throw new Error(
              "No customer identifier found for Autumn.identify()"
            );
          }

          return await ctx.runAction(this.component.entities.create, {
            customerId: identifierOpts.customerId,
            entities: args.entities,
            apiKey: this.options.apiKey,
          });
        },
      }),

      getEntity: actionGeneric({
        args: v.object({
          entityId: v.string(),
          expand: v.optional(v.array(v.literal("invoices"))),
        }),
        handler: async (ctx, args) => {
          const identifierOpts = await this.options.identify(ctx, {});
          if (!identifierOpts) {
            throw new Error(
              "No customer identifier found for Autumn.identify()"
            );
          }

          return await ctx.runAction(this.component.entities.get, {
            customerId: identifierOpts.customerId,
            entityId: args.entityId,
            expand: args.expand,
            apiKey: this.options.apiKey,
          });
        },
      }),

      deleteEntity: actionGeneric({
        args: v.object({
          entityId: v.string(),
        }),
        handler: async (ctx, args) => {
          const identifierOpts = await this.options.identify(ctx, {});
          if (!identifierOpts) {
            throw new Error(
              "No customer identifier found for Autumn.identify()"
            );
          }

          return await ctx.runAction(this.component.entities.discard, {
            customerId: identifierOpts.customerId,
            entityId: args.entityId,
            apiKey: this.options.apiKey,
          });
        },
      }),

      // Customer management
      getCustomer: actionGeneric({
        args: v.object({
          expand: v.optional(
            v.array(
              v.union(
                v.literal("invoices"),
                v.literal("rewards"),
                v.literal("trials_used"),
                v.literal("entities"),
                v.literal("referrals")
              )
            )
          ),
        }),
        handler: async (ctx, args) => {
          const identifierOpts = await this.options.identify(ctx, {});
          if (!identifierOpts) {
            throw new Error(
              "No customer identifier found for Autumn.identify()"
            );
          }

          return await autumn;
        },
      }),

      updateCustomer: actionGeneric({
        args: v.object({
          name: v.optional(v.string()),
          email: v.optional(v.string()),
        }),
        handler: async (ctx, args) => {
          const identifierOpts = await this.options.identify(ctx, {});
          if (!identifierOpts) {
            throw new Error(
              "No customer identifier found for Autumn.identify()"
            );
          }

          return await ctx.runAction(this.component.customers.update, {
            customerId: identifierOpts.customerId,
            name: args.name,
            email: args.email,
            apiKey: this.options.apiKey,
          });
        },
      }),

      deleteCustomer: actionGeneric({
        args: {},
        handler: async (ctx) => {
          const identifierOpts = await this.options.identify(ctx, {});
          if (!identifierOpts) {
            throw new Error(
              "No customer identifier found for Autumn.identify()"
            );
          }

          return await ctx.runAction(this.component.customers.discard, {
            customerId: identifierOpts.customerId,
            apiKey: this.options.apiKey,
          });
        },
      }),

      billingPortal: actionGeneric({
        args: v.object({
          returnUrl: v.optional(v.string()),
        }),
        handler: async (ctx, args) => {
          const identifierOpts = await this.options.identify(ctx, {});
          if (!identifierOpts) {
            throw new Error(
              "No customer identifier found for Autumn.identify()"
            );
          }

          return await ctx.runAction(this.component.customers.billingPortal, {
            customerId: identifierOpts.customerId,
            returnUrl: args.returnUrl,
            apiKey: this.options.apiKey,
          });
        },
      }),

      // Product methods
      getProduct: actionGeneric({
        args: v.object({
          productId: v.string(),
        }),
        handler: async (ctx, args) => {
          return await ctx.runAction(this.component.products.get, {
            productId: args.productId,
            apiKey: this.options.apiKey,
          });
        },
      }),

      listProducts: actionGeneric({
        args: {},
        handler: async (ctx) => {
          const identifierOpts = await this.options.identify(ctx, {});
          if (!identifierOpts) {
            throw new Error(
              "No customer identifier found for Autumn.identify()"
            );
          }

          return await ctx.runAction(this.component.lib.listProducts, {
            customerId: identifierOpts.customerId,
            apiKey: this.options.apiKey,
          });
        },
      }),

      // Referral methods
      createReferralCode: actionGeneric({
        args: v.object({
          programId: v.string(),
        }),
        handler: async (ctx, args) => {
          const identifierOpts = await this.options.identify(ctx, {});
          if (!identifierOpts) {
            throw new Error(
              "No customer identifier found for Autumn.identify()"
            );
          }

          return await ctx.runAction(this.component.referrals.createCode, {
            customerId: identifierOpts.customerId,
            programId: args.programId,
            apiKey: this.options.apiKey,
          });
        },
      }),

      redeemReferralCode: actionGeneric({
        args: v.object({
          code: v.string(),
        }),
        handler: async (ctx, args) => {
          const identifierOpts = await this.options.identify(ctx, {});
          if (!identifierOpts) {
            throw new Error(
              "No customer identifier found for Autumn.identify()"
            );
          }

          return await ctx.runAction(this.component.referrals.redeemCode, {
            customerId: identifierOpts.customerId,
            code: args.code,
            apiKey: this.options.apiKey,
          });
        },
      }),

      // Additional general methods
      usage: actionGeneric({
        args: v.object({
          featureId: v.string(),
          value: v.number(),
        }),
        handler: async (ctx, args) => {
          const identifierOpts = await this.options.identify(ctx, {});
          if (!identifierOpts) {
            throw new Error(
              "No customer identifier found for Autumn.identify()"
            );
          }

          const usageArgs: UsageArgsType = {
            ...args,
            customerId: identifierOpts.customerId,
            customerData: identifierOpts.customerData,
            apiKey: this.options.apiKey,
          };

          return await ctx.runAction(this.component.lib.usage, usageArgs);
        },
      }),

      query: actionGeneric({
        args: v.object({
          featureId: v.union(v.string(), v.array(v.string())),
        }),
        handler: async (ctx, args) => {
          const identifierOpts = await this.options.identify(ctx, {});
          if (!identifierOpts) {
            throw new Error(
              "No customer identifier found for Autumn.identify()"
            );
          }

          const queryArgs: QueryArgsType = {
            ...args,
            customerId: identifierOpts.customerId,
            customerData: identifierOpts.customerData,
            apiKey: this.options.apiKey,
          };

          return await ctx.runAction(this.component.lib.autumnQuery, queryArgs);
        },
      }),

      cancel: actionGeneric({
        args: v.object({
          productId: v.string(),
          entityId: v.optional(v.string()),
          cancelImmediately: v.optional(v.boolean()),
        }),
        handler: async (ctx, args) => {
          const identifierOpts = await this.options.identify(ctx, {});
          if (!identifierOpts) {
            throw new Error(
              "No customer identifier found for Autumn.identify()"
            );
          }

          const cancelArgs: CancelArgsType = {
            ...args,
            customerId: identifierOpts.customerId,
            customerData: identifierOpts.customerData,
            apiKey: this.options.apiKey,
          };

          return await ctx.runAction(this.component.lib.cancel, cancelArgs);
        },
      }),

      setupPayment: actionGeneric({
        args: v.object({
          successUrl: v.optional(v.string()),
          checkoutSessionParams: v.optional(v.object({})),
        }),
        handler: async (ctx, args) => {
          const identifierOpts = await this.options.identify(ctx, {});
          if (!identifierOpts) {
            throw new Error(
              "No customer identifier found for Autumn.identify()"
            );
          }

          const setupPaymentArgs: SetupPaymentArgsType = {
            ...args,
            customerId: identifierOpts.customerId,
            customerData: identifierOpts.customerData,
            apiKey: this.options.apiKey,
          };

          return await ctx.runAction(
            this.component.lib.setupPayment,
            setupPaymentArgs
          );
        },
      }),
    };
  }

  async registerRoutes(
    http: HttpRouter,
    options?: {
      corsOrigin?: string;
      corsOrigins?: string[];
      corsAllowHeadersList?: string[];
      allowCredentials?: boolean;
      browserCacheMaxAge?: number;
      enforceAllowOrigins?: boolean;
      debug?: boolean;
    }
  ) {
    const corsOrigin =
      options?.corsOrigin ||
      process.env.CLIENT_ORIGIN ||
      "http://localhost:3000";
    const corsAllowHeaders = options?.corsAllowHeadersList || [
      "Better-Auth-Cookie",
      "Cookie",
      "Content-Type",
      "Authorization",
    ];

    // Create CORS router with configuration
    const cors = corsRouter(http, {
      allowedOrigins: [corsOrigin, ...(options?.corsOrigins || [])],
      allowedHeaders: corsAllowHeaders,
      allowCredentials: options?.allowCredentials ?? true,
      browserCacheMaxAge: options?.browserCacheMaxAge ?? 86400,
      enforceAllowOrigins: options?.enforceAllowOrigins ?? false,
      debug: options?.debug ?? false,
    });

    // Register routes for all HTTP methods except OPTIONS
    for (const method of ROUTABLE_HTTP_METHODS.filter(
      (method) => method !== "OPTIONS"
    )) {
      cors.route({
        pathPrefix: "/api/autumn/",
        method: method,
        handler: httpActionGeneric(async (ctx, request) => {
          const identity = await this.options.identify(ctx, {});

          return await convexHandler({
            identity: identity,
            secretKey: this.options.apiKey,
            url: this.options.url || undefined,
            corsOrigin: corsOrigin,
          })(ctx, request);
        }),
      });
    }
  }
}
