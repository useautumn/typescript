/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as auth from "../auth.js";
import type * as autumn from "../autumn.js";
import type * as example from "../example.js";
import type * as http from "../http.js";
import type * as identify from "../identify.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  auth: typeof auth;
  autumn: typeof autumn;
  example: typeof example;
  http: typeof http;
  identify: typeof identify;
}>;
declare const fullApiWithMounts: typeof fullApi;

export declare const api: FilterApi<
  typeof fullApiWithMounts,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApiWithMounts,
  FunctionReference<any, "internal">
>;

export declare const components: {
  autumn: {
    customers: {
      billingPortal: FunctionReference<
        "action",
        "internal",
        { apiKey: string; customerId: string; returnUrl?: string },
        any
      >;
      create: FunctionReference<
        "action",
        "internal",
        { apiKey: string; customerId: string; email?: string; name?: string },
        any
      >;
      discard: FunctionReference<
        "action",
        "internal",
        { apiKey: string; customerId: string },
        any
      >;
      get: FunctionReference<
        "action",
        "internal",
        {
          apiKey: string;
          customerId: string;
          expand?: Array<
            "invoices" | "rewards" | "trials_used" | "entities" | "referrals"
          >;
        },
        any
      >;
      update: FunctionReference<
        "action",
        "internal",
        { apiKey: string; customerId: string; email?: string; name?: string },
        any
      >;
    };
    entities: {
      create: FunctionReference<
        "action",
        "internal",
        {
          apiKey: string;
          customerData?: {
            email?: string;
            fingerprint?: string;
            name?: string;
          };
          customerId: string;
          entities:
            | { feature_id: string; id: string; name: string }
            | Array<{ feature_id: string; id: string; name: string }>;
        },
        any
      >;
      discard: FunctionReference<
        "action",
        "internal",
        { apiKey: string; customerId: string; entityId: string },
        any
      >;
      get: FunctionReference<
        "action",
        "internal",
        {
          apiKey: string;
          customerData?: {
            email?: string;
            fingerprint?: string;
            name?: string;
          };
          customerId: string;
          entityId: string;
          expand?: Array<"invoices">;
        },
        any
      >;
    };
    lib: {
      add: FunctionReference<
        "mutation",
        "internal",
        { count: number; name: string; shards?: number },
        null
      >;
      attach: FunctionReference<
        "action",
        "internal",
        {
          apiKey: string;
          checkoutSessionParams?: {};
          customerData?: {
            email?: string;
            fingerprint?: string;
            name?: string;
          };
          customerId: string;
          entityId?: string;
          forceCheckout?: boolean;
          metadata?: {};
          options?: Array<{}>;
          productId: string;
          productIds?: Array<string>;
          reward?: string;
          successUrl?: string;
        },
        any
      >;
      autumnQuery: FunctionReference<
        "action",
        "internal",
        {
          apiKey: string;
          customerData?: {
            email?: string;
            fingerprint?: string;
            name?: string;
          };
          customerId: string;
          featureId: string | Array<string>;
        },
        any
      >;
      cancel: FunctionReference<
        "action",
        "internal",
        {
          apiKey: string;
          cancelImmediately?: boolean;
          customerData?: {
            email?: string;
            fingerprint?: string;
            name?: string;
          };
          customerId: string;
          entityId?: string;
          productId: string;
        },
        any
      >;
      check: FunctionReference<
        "action",
        "internal",
        {
          apiKey: string;
          customerData?: {
            email?: string;
            fingerprint?: string;
            name?: string;
          };
          customerId: string;
          entityId?: string;
          featureId?: string;
          productId?: string;
          requiredBalance?: number;
          sendEvent?: boolean;
          withPreview?: boolean;
        },
        any
      >;
      checkout: FunctionReference<
        "action",
        "internal",
        {
          apiKey: string;
          checkoutSessionParams?: {};
          customerData?: {
            email?: string;
            fingerprint?: string;
            name?: string;
          };
          customerId: string;
          entityId?: string;
          options?: Array<{}>;
          productId: string;
          productIds?: Array<string>;
          reward?: string;
          successUrl?: string;
        },
        any
      >;
      count: FunctionReference<"query", "internal", { name: string }, number>;
      fetchCustomer: FunctionReference<
        "action",
        "internal",
        {
          apiKey: string;
          customerData?: { email: string; name: string };
          customerId: string;
        },
        any
      >;
      listProducts: FunctionReference<
        "action",
        "internal",
        { apiKey: string; customerId?: string },
        any
      >;
      setupPayment: FunctionReference<
        "action",
        "internal",
        {
          apiKey: string;
          checkoutSessionParams?: {};
          customerData?: {
            email?: string;
            fingerprint?: string;
            name?: string;
          };
          customerId: string;
          successUrl?: string;
        },
        any
      >;
      track: FunctionReference<
        "action",
        "internal",
        {
          apiKey: string;
          customerData?: {
            email?: string;
            fingerprint?: string;
            name?: string;
          };
          customerId: string;
          entityId?: string;
          eventName?: string;
          featureId: string;
          idempotencyKey?: string;
          properties?: {};
          value?: number;
        },
        any
      >;
      usage: FunctionReference<
        "action",
        "internal",
        {
          apiKey: string;
          customerData?: {
            email?: string;
            fingerprint?: string;
            name?: string;
          };
          customerId: string;
          featureId: string;
          value: number;
        },
        any
      >;
    };
    products: {
      get: FunctionReference<
        "action",
        "internal",
        { apiKey: string; productId: string },
        any
      >;
      list: FunctionReference<
        "action",
        "internal",
        { apiKey: string; customerId?: string },
        any
      >;
    };
    referrals: {
      createCode: FunctionReference<
        "action",
        "internal",
        { apiKey: string; customerId: string; programId: string },
        any
      >;
      redeemCode: FunctionReference<
        "action",
        "internal",
        { apiKey: string; code: string; customerId: string },
        any
      >;
    };
  };
};
