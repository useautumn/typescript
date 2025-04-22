import { BillingPortalParams } from "src/sdk";
import { createAutumnClient } from "../server/cusActions";
import { withAuth } from "./auth/withAuth";

export const attachAction = withAuth(
  async ({
    customerId,
    productId,
  }: {
    customerId: string;
    productId: string;
  }) => {
    const autumn = createAutumnClient();
    return autumn.attach({ customer_id: customerId, product_id: productId });
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
