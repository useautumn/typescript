import { BillingPortalParams } from "src/sdk";
import { createAutumnClient } from "../server/cusActions";
import { withAuth } from "./auth/withAuth";
import { AttachFeatureOptions } from "src/sdk/general/genTypes";
import { toServerResponse } from "./utils";

export const attachAction = withAuth({
  fn: async ({
    customerId,
    productId,
    options,
    successUrl,
    forceCheckout,
    metadata,
  }: {
    customerId: string;
    productId: string;
    successUrl?: string;
    options?: AttachFeatureOptions[];
    forceCheckout?: boolean;
    metadata?: Record<string, string>;
  }) => {
    const autumn = createAutumnClient();

    let res = await autumn.attach({
      customer_id: customerId,
      product_id: productId,
      success_url: successUrl,
      options,
      force_checkout: forceCheckout,
      metadata,
    });

    return toServerResponse(res);
  },
});

export const entitledAction = withAuth({
  fn: async ({
    customerId,
    featureId,
  }: {
    customerId: string;
    featureId: string;
  }) => {
    const autumn = createAutumnClient();
    let res = await autumn.entitled({
      customer_id: customerId,
      feature_id: featureId,
    });

    return toServerResponse(res);
  },
});

export const checkAction = withAuth({
  fn: async ({
    customerId,
    featureId,
    productId,
    entityId,
    requiredQuantity,
    sendEvent,
    withPreview,
  }: {
    customerId: string;
    featureId?: string;
    productId?: string;
    entityId?: string;
    requiredQuantity?: number;
    sendEvent?: boolean;
    withPreview?: "raw" | "formatted";
  }) => {
    const autumn = createAutumnClient();

    let res = await autumn.check({
      customer_id: customerId,
      feature_id: featureId,
      product_id: productId,
      entity_id: entityId,
      required_quantity: requiredQuantity,
      send_event: sendEvent,
      with_preview: withPreview,
    });

    return toServerResponse(res);
  },
});

export const sendEventAction = withAuth({
  fn: async ({
    customerId,
    featureId,
    value,
  }: {
    customerId: string;
    featureId: string;
    value?: number;
  }) => {
    const autumn = createAutumnClient();
    let res = await autumn.event({
      customer_id: customerId,
      feature_id: featureId,
      value,
    });

    return toServerResponse(res);
  },
});

export const trackAction = withAuth({
  fn: async ({
    customerId,
    featureId,
    entityId,
    value,
  }: {
    customerId: string;
    featureId: string;
    entityId?: string;
    value?: number;
  }) => {
    const autumn = createAutumnClient();
    let res = await autumn.track({
      customer_id: customerId,
      feature_id: featureId,
      entity_id: entityId,
      value,
    });

    return toServerResponse(res);
  },
});

export const getBillingPortalAction = withAuth({
  fn: async ({
    customerId,
    params,
  }: {
    customerId: string;
    params?: BillingPortalParams;
  }) => {
    const autumn = createAutumnClient();
    let result = await autumn.customers.billingPortal(customerId, params);
    return toServerResponse(result);
  },
});
