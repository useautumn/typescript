import { BillingPortalParams, CustomerData } from "src/sdk";
import { createAutumnClient } from "../server/cusActions";
import { withAuth } from "./auth/withAuth";
import { AttachFeatureOptions } from "src/sdk/general/genTypes";

export const attachAction = withAuth(
  async ({
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

    return autumn.attach({
      customer_id: customerId,
      product_id: productId,
      success_url: successUrl,
      options,
      force_checkout: forceCheckout,
      metadata,
    });
  }
);

export const entitledAction = withAuth(
  async ({
    customerId,
    featureId,
  }: {
    customerId: string;
    featureId: string;
  }) => {
    const autumn = createAutumnClient();
    return autumn.entitled({ customer_id: customerId, feature_id: featureId });
  }
);

export const checkAction = withAuth(
  async ({
    customerId,
    featureId,
    productId,
    requiredQuantity,
    sendEvent,
  }: {
    customerId: string;
    featureId?: string;
    productId?: string;
    requiredQuantity?: number;
    sendEvent?: boolean;
  }) => {
    const autumn = createAutumnClient();
    return autumn.check({
      customer_id: customerId,
      feature_id: featureId,
      product_id: productId,
      required_quantity: requiredQuantity,
      send_event: sendEvent,
    });
  }
);

export const sendEventAction = withAuth(
  async ({
    customerId,
    featureId,
    value,
  }: {
    customerId: string;
    featureId: string;
    value?: number;
  }) => {
    const autumn = createAutumnClient();

    return autumn.event({
      customer_id: customerId,
      feature_id: featureId,
      value,
    });
  }
);

export const trackAction = withAuth(
  async ({
    customerId,
    featureId,
    value,
  }: {
    customerId: string;
    featureId: string;
    value?: number;
  }) => {
    const autumn = createAutumnClient();
    return autumn.track({
      customer_id: customerId,
      feature_id: featureId,
      value,
    });
  }
);
export const getBillingPortalAction = withAuth(
  async ({
    customerId,
    params,
  }: {
    customerId: string;
    params?: BillingPortalParams;
  }) => {
    const autumn = createAutumnClient();
    let result = await autumn.customers.billingPortal(customerId, params);
    return result;
  }
);
