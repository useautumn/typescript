/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as customers from "../customers.js";
import type * as entities from "../entities.js";
import type * as lib from "../lib.js";
import type * as products from "../products.js";
import type * as referrals from "../referrals.js";

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
  customers: typeof customers;
  entities: typeof entities;
  lib: typeof lib;
  products: typeof products;
  referrals: typeof referrals;
}>;
export type Mounts = {
  customers: {
    billingPortal: FunctionReference<
      "action",
      "public",
      { apiKey: string; customerId: string; returnUrl?: string },
      any
    >;
    create: FunctionReference<
      "action",
      "public",
      { apiKey: string; customerId: string; email?: string; name?: string },
      any
    >;
    discard: FunctionReference<
      "action",
      "public",
      { apiKey: string; customerId: string },
      any
    >;
    get: FunctionReference<
      "action",
      "public",
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
      "public",
      { apiKey: string; customerId: string; email?: string; name?: string },
      any
    >;
  };
  entities: {
    create: FunctionReference<
      "action",
      "public",
      {
        apiKey: string;
        customerData?: { email?: string; fingerprint?: string; name?: string };
        customerId: string;
        entities:
          | { feature_id: string; id: string; name: string }
          | Array<{ feature_id: string; id: string; name: string }>;
      },
      any
    >;
    discard: FunctionReference<
      "action",
      "public",
      { apiKey: string; customerId: string; entityId: string },
      any
    >;
    get: FunctionReference<
      "action",
      "public",
      {
        apiKey: string;
        customerData?: { email?: string; fingerprint?: string; name?: string };
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
      "public",
      { count: number; name: string; shards?: number },
      null
    >;
    attach: FunctionReference<
      "action",
      "public",
      {
        apiKey: string;
        checkoutSessionParams?: {};
        customerData?: { email?: string; fingerprint?: string; name?: string };
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
      "public",
      {
        apiKey: string;
        customerData?: { email?: string; fingerprint?: string; name?: string };
        customerId: string;
        featureId: string | Array<string>;
      },
      any
    >;
    cancel: FunctionReference<
      "action",
      "public",
      {
        apiKey: string;
        cancelImmediately?: boolean;
        customerData?: { email?: string; fingerprint?: string; name?: string };
        customerId: string;
        entityId?: string;
        productId: string;
      },
      any
    >;
    check: FunctionReference<
      "action",
      "public",
      {
        apiKey: string;
        customerData?: { email?: string; fingerprint?: string; name?: string };
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
      "public",
      {
        apiKey: string;
        checkoutSessionParams?: {};
        customerData?: { email?: string; fingerprint?: string; name?: string };
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
    count: FunctionReference<"query", "public", { name: string }, number>;
    fetchCustomer: FunctionReference<
      "action",
      "public",
      {
        apiKey: string;
        customerData?: { email: string; name: string };
        customerId: string;
      },
      any
    >;
    listProducts: FunctionReference<
      "action",
      "public",
      { apiKey: string; customerId?: string },
      any
    >;
    setupPayment: FunctionReference<
      "action",
      "public",
      {
        apiKey: string;
        checkoutSessionParams?: {};
        customerData?: { email?: string; fingerprint?: string; name?: string };
        customerId: string;
        successUrl?: string;
      },
      any
    >;
    track: FunctionReference<
      "action",
      "public",
      {
        apiKey: string;
        customerData?: { email?: string; fingerprint?: string; name?: string };
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
      "public",
      {
        apiKey: string;
        customerData?: { email?: string; fingerprint?: string; name?: string };
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
      "public",
      { apiKey: string; productId: string },
      any
    >;
    list: FunctionReference<
      "action",
      "public",
      { apiKey: string; customerId?: string },
      any
    >;
  };
  referrals: {
    createCode: FunctionReference<
      "action",
      "public",
      { apiKey: string; customerId: string; programId: string },
      any
    >;
    redeemCode: FunctionReference<
      "action",
      "public",
      { apiKey: string; code: string; customerId: string },
      any
    >;
  };
};
// For now fullApiWithMounts is only fullApi which provides
// jump-to-definition in component client code.
// Use Mounts for the same type without the inference.
declare const fullApiWithMounts: typeof fullApi;

export declare const api: FilterApi<
  typeof fullApiWithMounts,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApiWithMounts,
  FunctionReference<any, "internal">
>;

export declare const components: {};
