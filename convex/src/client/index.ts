import { actionGeneric, mutationGeneric, queryGeneric, httpActionGeneric } from "convex/server";
import type {
  ActionBuilder,
  GenericDataModel,
  FunctionVisibility,
  HttpRouter,
  GenericActionCtx,
} from "convex/server";
import { ROUTABLE_HTTP_METHODS } from "convex/server";
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

  async add(ctx: RunMutationCtx, name: string, count: number = 1) {
    return ctx.runMutation(this.component.lib.add, {
      name,
      count,
    });
  }

  async count(ctx: RunQueryCtx, name: string) {
    return ctx.runQuery(this.component.lib.count, { name });
  }

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

  async registerRoutes(
    http: HttpRouter, 
    options?: {
      corsOrigin?: string;
      corsAllowHeadersList?: string[];
    }
  ) {
    // OPTIONS handler for CORS preflight
    http.route({
      pathPrefix: "/api/autumn/",
      method: "OPTIONS",
      handler: httpActionGeneric(async (_, req) => {
        const corsOrigin = options?.corsOrigin || process.env.CLIENT_ORIGIN || "http://localhost:3000";
        console.log("CORS Origin:", corsOrigin);
        const corsAllowHeaders = options?.corsAllowHeadersList?.join(", ") || "Better-Auth-Cookie, Cookie, Content-Type, Authorization";
        console.log("CORS Allow Headers:", corsAllowHeaders);
        return new Response(null, {
          headers: new Headers({
            "Access-Control-Allow-Origin": corsOrigin,
            "Access-Control-Allow-Methods": "POST, GET, PATCH, DELETE, OPTIONS",
            "Access-Control-Allow-Headers": corsAllowHeaders,
            "Access-Control-Allow-Credentials": "true",
            "Access-Control-Max-Age": "86400",
          }),
        });
      }),
    });

    // Register routes for all HTTP methods except OPTIONS
    for (const method of ROUTABLE_HTTP_METHODS.filter(
      (method) => method !== "OPTIONS"
    )) {
      http.route({
        pathPrefix: "/api/autumn/",
        method: method,
        handler: httpActionGeneric(async (ctx, request) => {
          const identity = await this.options.identify(ctx, request);
          console.log("Identity:", identity);

          return await convexHandler({
            identity: identity,
            secretKey: this.options.apiKey,
            url: this.options.url || undefined,
            corsOrigin: options?.corsOrigin || process.env.CLIENT_ORIGIN || undefined,
          })(ctx, request);
        }),
      });
    }
  }
}
