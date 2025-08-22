import { actionGeneric, mutationGeneric, queryGeneric, httpActionGeneric } from "convex/server";
import type {
  ActionBuilder,
  FunctionVisibility,
  HttpRouter,
  GenericActionCtx,
} from "convex/server";
import { ROUTABLE_HTTP_METHODS } from "convex/server";
import { corsRouter } from "convex-helpers/server/cors";
import { v } from "convex/values";
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
  UsageArgsType,
  QueryArgsType,
  CancelArgsType,
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
      identify: (ctx: RunQueryCtx | RunActionCtx | RunMutationCtx, request?: Request) => Promise<{
        customerId: string;
        customerData: {
          name: string;
          email: string;
        };
      } | null>;
      apiKey: string;
      url?: string;
    }
  ) {}

  async customer(ctx: RunActionCtx) {
    let identifierOpts = await this.options.identify(ctx);
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

  async track(ctx: RunActionCtx, args: Omit<TrackArgsType, "apiKey" | "customerId" | "customerData">) {
    let identifierOpts = await this.options.identify(ctx);
    if (!identifierOpts) {
      throw new Error("No customer identifier found for Autumn.identify()");
    }

    const trackArgs: TrackArgsType = {
      ...args,
      customerId: identifierOpts.customerId,
      customerData: identifierOpts.customerData,
      apiKey: this.options.apiKey,
    };

    return ctx.runAction((this.component.lib as any).track, trackArgs);
  }

  async attach(ctx: RunActionCtx, args: Omit<AttachArgsType, "apiKey" | "customerId" | "customerData">) {
    let identifierOpts = await this.options.identify(ctx);
    if (!identifierOpts) {
      throw new Error("No customer identifier found for Autumn.identify()");
    }

    const attachArgs: AttachArgsType = {
      ...args,
      customerId: identifierOpts.customerId,
      customerData: identifierOpts.customerData,
      apiKey: this.options.apiKey,
    };

    return ctx.runAction((this.component.lib as any).attach, attachArgs);
  }

  async check(ctx: RunActionCtx, args: Omit<CheckArgsType, "apiKey" | "customerId" | "customerData">) {
    let identifierOpts = await this.options.identify(ctx);
    if (!identifierOpts) {
      throw new Error("No customer identifier found for Autumn.identify()");
    }

    const checkArgs: CheckArgsType = {
      ...args,
      customerId: identifierOpts.customerId,
      customerData: identifierOpts.customerData,
      apiKey: this.options.apiKey,
    };

    return ctx.runAction((this.component.lib as any).check, checkArgs);
  }

  async checkout(ctx: RunActionCtx, args: Omit<CheckoutArgsType, "apiKey" | "customerId" | "customerData">) {
    let identifierOpts = await this.options.identify(ctx);
    if (!identifierOpts) {
      throw new Error("No customer identifier found for Autumn.identify()");
    }

    const checkoutArgs: CheckoutArgsType = {
      ...args,
      customerId: identifierOpts.customerId,
      customerData: identifierOpts.customerData,
      apiKey: this.options.apiKey,
    };

    return ctx.runAction((this.component.lib as any).checkout, checkoutArgs);
  }

  async createEntity(ctx: RunActionCtx, args: Omit<UserCreateEntityArgsType, "apiKey" | "customerId" | "customerData">) {
    let identifierOpts = await this.options.identify(ctx);
    if (!identifierOpts) {
      throw new Error("No customer identifier found for Autumn.identify()");
    }

    return ctx.runAction((this.component as any).entities.create, {
      customerId: identifierOpts.customerId,
      entities: args.entities,
      apiKey: this.options.apiKey,
    });
  }

  async deleteEntity(ctx: RunActionCtx, args: Omit<DeleteEntityArgsType, "apiKey" | "customerId" | "customerData">) {
    let identifierOpts = await this.options.identify(ctx);
    if (!identifierOpts) {
      throw new Error("No customer identifier found for Autumn.identify()");
    }

    return ctx.runAction((this.component as any).entities.discard, {
      customerId: identifierOpts.customerId,
      entityId: args.entityId,
      apiKey: this.options.apiKey,
    });
  }

  async getEntity(ctx: RunActionCtx, args: Omit<GetEntityArgsType, "apiKey" | "customerId" | "customerData">) {
    let identifierOpts = await this.options.identify(ctx);
    if (!identifierOpts) {
      throw new Error("No customer identifier found for Autumn.identify()");
    }

    return ctx.runAction((this.component as any).entities.get, {
      customerId: identifierOpts.customerId,
      entityId: args.entityId,
      expand: args.expand,
      apiKey: this.options.apiKey,
    });
  }

  // Customer methods
  async getCustomer(ctx: RunActionCtx, args?: Omit<GetCustomerArgsType, "apiKey" | "customerId">) {
    let identifierOpts = await this.options.identify(ctx);
    if (!identifierOpts) {
      throw new Error("No customer identifier found for Autumn.identify()");
    }

    return ctx.runAction((this.component as any).customers.get, {
      customerId: identifierOpts.customerId,
      expand: args?.expand,
      apiKey: this.options.apiKey,
    });
  }

  async updateCustomer(ctx: RunActionCtx, args: Omit<UpdateCustomerArgsType, "apiKey" | "customerId">) {
    let identifierOpts = await this.options.identify(ctx);
    if (!identifierOpts) {
      throw new Error("No customer identifier found for Autumn.identify()");
    }

    return ctx.runAction((this.component as any).customers.update, {
      customerId: identifierOpts.customerId,
      name: args.name,
      email: args.email,
      apiKey: this.options.apiKey,
    });
  }

  async deleteCustomer(ctx: RunActionCtx) {
    let identifierOpts = await this.options.identify(ctx);
    if (!identifierOpts) {
      throw new Error("No customer identifier found for Autumn.identify()");
    }

    return ctx.runAction((this.component as any).customers.discard, {
      customerId: identifierOpts.customerId,
      apiKey: this.options.apiKey,
    });
  }

  async billingPortal(ctx: RunActionCtx, args?: Omit<BillingPortalArgsType, "apiKey" | "customerId">) {
    let identifierOpts = await this.options.identify(ctx);
    if (!identifierOpts) {
      throw new Error("No customer identifier found for Autumn.identify()");
    }

    return ctx.runAction((this.component as any).customers.billingPortal, {
      customerId: identifierOpts.customerId,
      returnUrl: args?.returnUrl,
      apiKey: this.options.apiKey,
    });
  }

  // Product methods
  async getProduct(ctx: RunActionCtx, args: Omit<GetProductArgsType, "apiKey">) {
    return ctx.runAction((this.component as any).products.get, {
      productId: args.productId,
      apiKey: this.options.apiKey,
    });
  }

  async listProducts(ctx: RunActionCtx) {
    let identifierOpts = await this.options.identify(ctx);
    if (!identifierOpts) {
      throw new Error("No customer identifier found for Autumn.identify()");
    }

    return ctx.runAction((this.component as any).products.list, {
      customerId: identifierOpts.customerId,
      apiKey: this.options.apiKey,
    });
  }

  // Referral methods
  async createReferralCode(ctx: RunActionCtx, args: Omit<CreateReferralCodeArgsType, "apiKey" | "customerId">) {
    let identifierOpts = await this.options.identify(ctx);
    if (!identifierOpts) {
      throw new Error("No customer identifier found for Autumn.identify()");
    }

    return ctx.runAction((this.component as any).referrals.createCode, {
      customerId: identifierOpts.customerId,
      programId: args.programId,
      apiKey: this.options.apiKey,
    });
  }

  async redeemReferralCode(ctx: RunActionCtx, args: Omit<RedeemReferralCodeArgsType, "apiKey" | "customerId">) {
    let identifierOpts = await this.options.identify(ctx);
    if (!identifierOpts) {
      throw new Error("No customer identifier found for Autumn.identify()");
    }

    return ctx.runAction((this.component as any).referrals.redeemCode, {
      customerId: identifierOpts.customerId,
      code: args.code,
      apiKey: this.options.apiKey,
    });
  }

  // Additional general methods
  async usage(ctx: RunActionCtx, args: Omit<UsageArgsType, "apiKey" | "customerId" | "customerData">) {
    let identifierOpts = await this.options.identify(ctx);
    if (!identifierOpts) {
      throw new Error("No customer identifier found for Autumn.identify()");
    }

    const usageArgs: UsageArgsType = {
      ...args,
      customerId: identifierOpts.customerId,
      customerData: identifierOpts.customerData,
      apiKey: this.options.apiKey,
    };

    return ctx.runAction((this.component.lib as any).usage, usageArgs);
  }

  async query(ctx: RunActionCtx, args: Omit<QueryArgsType, "apiKey" | "customerId" | "customerData">) {
    let identifierOpts = await this.options.identify(ctx);
    if (!identifierOpts) {
      throw new Error("No customer identifier found for Autumn.identify()");
    }

    const queryArgs: QueryArgsType = {
      ...args,
      customerId: identifierOpts.customerId,
      customerData: identifierOpts.customerData,
      apiKey: this.options.apiKey,
    };

    return ctx.runAction((this.component.lib as any).autumnQuery, queryArgs);
  }

  async cancel(ctx: RunActionCtx, args: Omit<CancelArgsType, "apiKey" | "customerId" | "customerData">) {
    let identifierOpts = await this.options.identify(ctx);
    if (!identifierOpts) {
      throw new Error("No customer identifier found for Autumn.identify()");
    }

    const cancelArgs: CancelArgsType = {
      ...args,
      customerId: identifierOpts.customerId,
      customerData: identifierOpts.customerData,
      apiKey: this.options.apiKey,
    };

    return ctx.runAction((this.component.lib as any).cancel, cancelArgs);
  }

  async setupPayment(ctx: RunActionCtx, args: Omit<SetupPaymentArgsType, "apiKey" | "customerId" | "customerData">) {
    let identifierOpts = await this.options.identify(ctx);
    if (!identifierOpts) {
      throw new Error("No customer identifier found for Autumn.identify()");
    }

    const setupPaymentArgs: SetupPaymentArgsType = {
      ...args,
      customerId: identifierOpts.customerId,
      customerData: identifierOpts.customerData,
      apiKey: this.options.apiKey,
    };

    return ctx.runAction((this.component.lib as any).setupPayment, setupPaymentArgs);
  }

  // Organized access patterns
  customers = {
    get: this.getCustomer.bind(this),
    update: this.updateCustomer.bind(this),
    delete: this.deleteCustomer.bind(this),
    billingPortal: this.billingPortal.bind(this),
  };

  products = {
    get: this.getProduct.bind(this),
    list: this.listProducts.bind(this),
  };

  referrals = {
    createCode: this.createReferralCode.bind(this),
    redeemCode: this.redeemReferralCode.bind(this),
  };

  entities = {
    create: this.createEntity.bind(this),
    get: this.getEntity.bind(this),
    delete: this.deleteEntity.bind(this),
  };

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
    const corsOrigin = options?.corsOrigin || process.env.CLIENT_ORIGIN || "http://localhost:3000";
    const corsAllowHeaders = options?.corsAllowHeadersList || ["Better-Auth-Cookie", "Cookie", "Content-Type", "Authorization"];
    
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
          const identity = await this.options.identify(ctx, request);

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
