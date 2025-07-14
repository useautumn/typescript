import { BillingPortalParams, CustomerData, EntityData } from "../../sdk";
import { createAutumnClient } from "../server/cusActions";
import { withAuth } from "./auth/withNextAuth";
import { toServerResponse } from "./utils";
import {
  CancelParams,
  CheckParams,
  TrackParams,
} from "../../libraries/react/client/types/clientGenTypes";
import { toSnakeCase } from "../../utils/toSnakeCase";
import { AttachParams } from "@/client/types/clientAttachTypes";

export const attachAction = withAuth({
  fn: async (
    params: AttachParams & { customerId: string; customerData?: CustomerData }
  ) => {
    const autumn = createAutumnClient();

    let res = await autumn.attach({
      customer_id: params.customerId,
      customer_data: params.customerData,
      ...toSnakeCase(params),
    });

    return toServerResponse(res);
  },

  withCustomerData: true,
});

export const cancelAction = withAuth({
  fn: async (params: CancelParams & { customerId: string }) => {
    const autumn = createAutumnClient();
    let res = await autumn.cancel(toSnakeCase(params));

    return toServerResponse(res);
  },
});

export const checkAction = withAuth({
  fn: async (
    params: CheckParams & { customerId: string; customerData?: CustomerData }
  ) => {
    const autumn = createAutumnClient();

    let res = await autumn.check({
      customer_id: params.customerId,
      customer_data: params.customerData,
      ...toSnakeCase(params),
    });

    return toServerResponse(res);
  },
  withCustomerData: true,
});

export const trackAction = withAuth({
  fn: async (
    params: TrackParams & { customerId: string; customerData?: CustomerData }
  ) => {
    const autumn = createAutumnClient();
    let res = await autumn.track({
      customer_id: params.customerId,
      customer_data: params.customerData,
      ...toSnakeCase(params),
    });

    return toServerResponse(res);
  },
  withCustomerData: true,
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

export const generateReferralCodeAction = withAuth({
  fn: async ({
    customerId,
    programId,
  }: {
    customerId: string;
    programId: string;
  }) => {
    const autumn = createAutumnClient();
    let result = await autumn.referrals.createCode({
      customer_id: customerId,
      program_id: programId,
    });
    return toServerResponse(result);
  },
});

export const redeemReferralCodeAction = withAuth({
  fn: async ({ code, customerId }: { code: string; customerId: string }) => {
    const autumn = createAutumnClient();
    let result = await autumn.referrals.redeemCode({
      code,
      customer_id: customerId,
    });
    return toServerResponse(result);
  },
});
