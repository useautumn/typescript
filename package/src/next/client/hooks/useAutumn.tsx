import {
  attachAction,
  entitledAction,
  getBillingPortalAction,
  sendEventAction,
} from "../../server/genActions";

import { useAutumnContext } from "../AutumnContext";
import { useCustomer } from "./useCustomer";

export interface UseAutumnOptions {
  autoCreate?: boolean;
}

export const useAutumn = (options?: UseAutumnOptions) => {
  const { encryptedCustomerId } = useAutumnContext();

  const {
    customer,
    isLoading: loading,
    error,
    refetch,
  } = useCustomer({
    autoCreate: options?.autoCreate,
  });

  const attach = async ({ productId }: { productId: string }) => {
    const result = await attachAction({
      encryptedCustomerId,
      productId,
    });

    if (result.error) {
      throw result.error;
    }

    let data = result.data;

    if (data?.checkout_url && typeof window !== "undefined") {
      window.open(data.checkout_url, "_blank");
    }
    return result;
  };

  const entitled = async ({ featureId }: { featureId: string }) => {
    const { data, error } = await entitledAction({
      encryptedCustomerId,
      featureId,
    });
    if (error) {
      throw error;
    }
    return data;
  };

  const sendEvent = async ({
    featureId,
    value,
  }: {
    featureId: string;
    value?: number;
  }) => {
    const { data, error } = await sendEventAction({
      encryptedCustomerId,
      featureId,
      value,
    });
    if (error) {
      throw error;
    }
    return data;
  };

  const openBillingPortal = async () => {
    const result = await getBillingPortalAction({
      encryptedCustomerId,
      params: {
        return_url: "https://example.com",
      },
    });

    if (result.error) {
      throw result.error;
    }

    let data = result.data;

    if (data?.url && typeof window !== "undefined") {
      window.open(data.url, "_blank");
      return data;
    } else {
      return data;
    }
  };

  // 2. Create a client
  return {
    customer,
    loading,
    error,
    refetch,

    attach,
    sendEvent,
    entitled,
    openBillingPortal,
  };
};
