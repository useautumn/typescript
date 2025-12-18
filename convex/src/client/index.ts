import { actionGeneric } from "convex/server";
import { v } from "convex/values";
import {
  type TrackArgsType,
  type CheckoutArgsType,
  TrackArgs,
  CheckArgs,
  AttachArgs,
  CheckoutArgs,
  type CheckArgsType,
  type AttachArgsType,
  QueryArgs,
  CancelArgs,
  SetupPaymentArgs,
  UsageArgs,
  BillingPortalArgs,
  CreateReferralCodeArgs,
  RedeemReferralCodeArgs,
  CreateEntityArgs,
  GetEntityArgs,
  type GetCustomerArgsType,
  type UpdateCustomerArgsType,
  type CreateCustomerArgsType,
  ExpandArgs,
  type BillingPortalArgsType,
  type GetEntityArgsType,
  type CreateEntityArgsType,
  type CreateReferralCodeArgsType,
  type RedeemReferralCodeArgsType,
  EventListArgs,
  EventAggregateArgs,
  type EventListArgsType,
  type EventAggregateArgsType,
} from "../types.js";
import type { ComponentApi } from "../component/_generated/component.js";

import { Autumn as AutumnSDK } from "autumn-js";

import * as autumnHelpers from "./helpers/index.js";

// UseApi<typeof api> is an alternative that has jump-to-definition but is
// less stable and reliant on types within the component files, which can cause
// issues where passing `components.foo` doesn't match the argument
export type AutumnComponent = ComponentApi;

export class Autumn {
  constructor(
    public component: AutumnComponent,
    public options: {
      identify: any;
      secretKey: string;
      url?: string;
    }
  ) {}

  async getAuthParams({
    ctx,
    requireAuth = true,
  }: {
    ctx: any;
    requireAuth?: boolean;
  }) {
    const identifierOpts = await this.getIdentifierOpts(ctx);
    const autumn = new AutumnSDK({
      secretKey: this.options.secretKey || process.env.AUTUMN_SECRET_KEY,
      url: this.options.url,
    });

    if (requireAuth) {
      if (!identifierOpts) {
        throw new Error("No customer identifier found for Autumn.identify()");
      }
    }

    return {
      autumn,
      identifierOpts,
    };
  }

  async track(ctx: any, args: TrackArgsType) {
    const { autumn, identifierOpts } = await this.getAuthParams({ ctx });
    return await autumnHelpers.track({
      autumn,
      identifierOpts,
      args,
    });
  }

  async check(ctx: any, args: CheckArgsType) {
    const { autumn, identifierOpts } = await this.getAuthParams({ ctx });
    return await autumnHelpers.check({
      autumn,
      identifierOpts,
      args,
    });
  }

  async attach(ctx: any, args: AttachArgsType) {
    const { autumn, identifierOpts } = await this.getAuthParams({ ctx });
    return await autumnHelpers.attach({
      autumn,
      identifierOpts,
      args,
    });
  }

  async checkout(ctx: any, args: CheckoutArgsType) {
    const { autumn, identifierOpts } = await this.getAuthParams({ ctx });
    return await autumnHelpers.checkout({
      autumn,
      identifierOpts,
      args,
    });
  }

  customers = {
    get: async (ctx: any, args?: GetCustomerArgsType) => {
      const { autumn, identifierOpts } = await this.getAuthParams({ ctx });
      return await autumnHelpers.customers.get({
        autumn,
        identifierOpts,
        args,
      });
    },

    update: async (ctx: any, args: UpdateCustomerArgsType) => {
      const { autumn, identifierOpts } = await this.getAuthParams({ ctx });
      return await autumnHelpers.customers.update({
        autumn,
        identifierOpts,
        args,
      });
    },
    delete: async (ctx: any) => {
      const { autumn, identifierOpts } = await this.getAuthParams({ ctx });
      return await autumnHelpers.customers.discard({
        autumn,
        identifierOpts,
      });
    },
    create: async (ctx: any, args: CreateCustomerArgsType) => {
      const { autumn } = await this.getAuthParams({
        ctx,
      });
      return await autumnHelpers.customers.create({
        autumn,
        args,
        useArgs: false,
      });
    },

    billingPortal: async (ctx: any, args: BillingPortalArgsType) => {
      const { autumn, identifierOpts } = await this.getAuthParams({ ctx });
      return await autumnHelpers.customers.billingPortal({
        autumn,
        identifierOpts,
        args,
      });
    },
  };

  entities = {
    get: async (
      ctx: any,
      entityId: string,
      args?: Omit<GetEntityArgsType, "entityId">
    ) => {
      const { autumn, identifierOpts } = await this.getAuthParams({ ctx });
      return await autumnHelpers.entities.get({
        autumn,
        identifierOpts,
        args: { entityId, ...(args || {}) },
      });
    },

    create: async (ctx: any, args: CreateEntityArgsType) => {
      const { autumn, identifierOpts } = await this.getAuthParams({ ctx });
      return await autumnHelpers.entities.create({
        autumn,
        identifierOpts,
        args,
      });
    },

    delete: async (ctx: any, entityId: string) => {
      const { autumn, identifierOpts } = await this.getAuthParams({ ctx });
      return await autumnHelpers.entities.discard({
        autumn,
        identifierOpts,
        entityId,
      });
    },
  };

  products = {
    get: async (ctx: any, productId: string) => {
      const { autumn } = await this.getAuthParams({ ctx, requireAuth: false });
      return await autumnHelpers.products.get({
        autumn,
        productId,
      });
    },
    list: async (ctx: any) => {
      const { autumn, identifierOpts } = await this.getAuthParams({
        ctx,
        requireAuth: false,
      });

      return await autumnHelpers.products.list({
        autumn,
        identifierOpts,
      });
    },
  };

  referrals = {
    createCode: async (ctx: any, args: CreateReferralCodeArgsType) => {
      const { autumn, identifierOpts } = await this.getAuthParams({ ctx });
      return await autumnHelpers.referrals.createCode({
        autumn,
        identifierOpts,
        args,
      });
    },
    redeemCode: async (ctx: any, args: RedeemReferralCodeArgsType) => {
      const { autumn, identifierOpts } = await this.getAuthParams({ ctx });
      return await autumnHelpers.referrals.redeemCode({
        autumn,
        identifierOpts,
        args,
      });
    },
  };

  events = {
    list: async (ctx: any, args: EventListArgsType) => {
      const { autumn, identifierOpts } = await this.getAuthParams({ ctx, requireAuth: false });
      return await autumnHelpers.events.list({
        autumn,
        identifierOpts,
        args,
      });
    },
    aggregate: async (ctx: any, args: EventAggregateArgsType) => {
      const { autumn, identifierOpts } = await this.getAuthParams({ ctx, requireAuth: false });
      return await autumnHelpers.events.aggregate({
        autumn,
        identifierOpts,
        args,
      });
    },
  };

  /**
   * Utility to re-export actions with automatic customer identification.
   * Example usage:
   *   autumn.api().track({ featureId: "message" })
   */
  api() {
    return {
      // Core tracking and checking methods
      track: actionGeneric({
        args: TrackArgs,
        handler: async (ctx, args) => {
          const { autumn, identifierOpts } = await this.getAuthParams({ ctx });

          return await autumnHelpers.track({
            autumn,
            identifierOpts,
            args,
          });
        },
      }),

      check: actionGeneric({
        args: CheckArgs,
        handler: async (ctx, args) => {
          const { autumn, identifierOpts } = await this.getAuthParams({ ctx });

          return await autumnHelpers.check({
            autumn,
            identifierOpts,
            args,
          });
        },
      }),

      // Product attachment and checkout
      attach: actionGeneric({
        args: AttachArgs,
        handler: async (ctx, args) => {
          const { autumn, identifierOpts } = await this.getAuthParams({ ctx });

          return await autumnHelpers.attach({
            autumn,
            identifierOpts,
            args,
          });
        },
      }),

      checkout: actionGeneric({
        args: CheckoutArgs,
        handler: async (ctx, args) => {
          const { autumn, identifierOpts } = await this.getAuthParams({ ctx });

          return await autumnHelpers.checkout({
            autumn,
            identifierOpts,
            args,
          });
        },
      }),

      createCustomer: actionGeneric({
        args: v.object({
          expand: ExpandArgs,
          errorOnNotFound: v.optional(v.boolean()),
        }),
        handler: async (ctx, args) => {
          const { autumn, identifierOpts } = await this.getAuthParams({
            ctx,
            requireAuth: args.errorOnNotFound === false ? false : true,
          });

          if (args.errorOnNotFound === false && !identifierOpts) {
            return {
              data: null,
              error: null,
              statusCode: 202,
            };
          }

          return await autumnHelpers.customers.create({
            autumn,
            identifierOpts,
            args,
          });
        },
      }),

      listProducts: actionGeneric({
        args: {},
        handler: async (ctx) => {
          const { autumn, identifierOpts } = await this.getAuthParams({
            ctx,
            requireAuth: false,
          });

          const result = await autumnHelpers.products.list({
            autumn,
            identifierOpts,
          });

          return result;
        },
      }),

      // Additional general methods
      usage: actionGeneric({
        args: UsageArgs,
        handler: async (ctx, args) => {
          const { autumn, identifierOpts } = await this.getAuthParams({ ctx });

          return await autumnHelpers.usage({
            autumn,
            identifierOpts,
            args,
          });
        },
      }),

      query: actionGeneric({
        args: QueryArgs,
        handler: async (ctx, args) => {
          const { autumn, identifierOpts } = await this.getAuthParams({ ctx });

          return await autumnHelpers.autumnQuery({
            autumn,
            identifierOpts,
            args,
          });
        },
      }),

      cancel: actionGeneric({
        args: CancelArgs,
        handler: async (ctx, args) => {
          const { autumn, identifierOpts } = await this.getAuthParams({ ctx });

          return await autumnHelpers.cancel({
            autumn,
            identifierOpts,
            args,
          });
        },
      }),

      setupPayment: actionGeneric({
        args: SetupPaymentArgs,
        handler: async (ctx, args) => {
          const { autumn, identifierOpts } = await this.getAuthParams({ ctx });

          return await autumnHelpers.setupPayment({
            autumn,
            identifierOpts,
            args,
          });
        },
      }),

      billingPortal: actionGeneric({
        args: BillingPortalArgs,
        handler: async (ctx, args) => {
          const { autumn, identifierOpts } = await this.getAuthParams({ ctx });

          return await autumnHelpers.customers.billingPortal({
            autumn,
            identifierOpts,
            args,
          });
        },
      }),

      createReferralCode: actionGeneric({
        args: CreateReferralCodeArgs,
        handler: async (ctx, args) => {
          const { autumn, identifierOpts } = await this.getAuthParams({
            ctx,
          });
          return await autumnHelpers.referrals.createCode({
            autumn,
            identifierOpts,
            args,
          });
        },
      }),

      redeemReferralCode: actionGeneric({
        args: RedeemReferralCodeArgs,
        handler: async (ctx, args) => {
          const { autumn, identifierOpts } = await this.getAuthParams({
            ctx,
          });
          return await autumnHelpers.referrals.redeemCode({
            autumn,
            identifierOpts,
            args,
          });
        },
      }),

      createEntity: actionGeneric({
        args: CreateEntityArgs,
        handler: async (ctx, args) => {
          const { autumn, identifierOpts } = await this.getAuthParams({ ctx });
          return await autumnHelpers.entities.create({
            autumn,
            identifierOpts,
            args,
          });
        },
      }),

      getEntity: actionGeneric({
        args: GetEntityArgs,
        handler: async (ctx, args) => {
          const { autumn, identifierOpts } = await this.getAuthParams({ ctx });
          return await autumnHelpers.entities.get({
            autumn,
            identifierOpts,
            args,
          });
        },
      }),

      listEvents: actionGeneric({
        args: EventListArgs,
        handler: async (ctx, args) => {
          const { autumn, identifierOpts } = await this.getAuthParams({
            ctx,
            requireAuth: false,
          });
          return await autumnHelpers.events.list({
            autumn,
            identifierOpts,
            args,
          });
        },
      }),

      aggregateEvents: actionGeneric({
        args: EventAggregateArgs,
        handler: async (ctx, args) => {
          const { autumn, identifierOpts } = await this.getAuthParams({
            ctx,
            requireAuth: false,
          });
          return await autumnHelpers.events.aggregate({
            autumn,
            identifierOpts,
            args,
          });
        },
      }),
    };
  }

  async getIdentifierOpts(ctx: any) {
    const identifierOpts = await this.options.identify(ctx);

    return identifierOpts;
  }
}
