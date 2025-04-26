import {
  attachAction,
  checkAction,
  entitledAction,
  getBillingPortalAction,
  sendEventAction,
  trackAction,
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

  const attach = async ({
    productId,
    options,
    successUrl,
    forceCheckout,
    metadata,
  }: {
    productId: string;
    options?: {
      featureId: string;
      quantity: number;
    }[];
    successUrl?: string;
    forceCheckout?: boolean;
    metadata?: Record<string, string>;
  }) => {
    let snakeOptions =
      options?.map((option) => ({
        feature_id: option.featureId,
        quantity: option.quantity,
      })) || undefined;

    const result = await attachAction({
      encryptedCustomerId,
      productId,
      options: snakeOptions,
      successUrl,
      forceCheckout,
      metadata,
    });

    if (result.error) {
      throw result.error;
    }

    let data = result.data;

    if (data?.checkout_url && typeof window !== "undefined") {
      window.open(data.checkout_url, "_blank");
    }
    return result.data;
  };

  /**
   * @deprecated Use check({featureId}) instead.
   * This method is deprecated and will be removed in a future version.
   */
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

  const check = async ({
    featureId,
    productId,
    requiredQuantity,
    sendEvent,
  }: {
    featureId?: string;
    productId?: string;
    requiredQuantity?: number;
    sendEvent?: boolean;
  }) => {
    const { data, error } = await checkAction({
      encryptedCustomerId,
      featureId,
      productId,
      requiredQuantity,
      sendEvent,
    });

    if (error) {
      throw error;
    }

    return data;
  };

  const track = async ({
    featureId,
    value,
  }: {
    featureId: string;
    value?: number;
  }) => {
    const { data, error } = await trackAction({
      encryptedCustomerId,
      featureId,
      value,
    });

    if (error) {
      throw error;
    }

    return data;
  };

  /**
   * @deprecated Use track({featureId, value}) instead.
   * This method is deprecated and will be removed in a future version.
   */
  const event = async ({
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

  const openBillingPortal = async (options?: { returnUrl?: string }) => {
    const result = await getBillingPortalAction({
      encryptedCustomerId,
      params: {
        return_url: options?.returnUrl,
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

    /**
     * @deprecated Use track({featureId, value}) instead.
     * This method is deprecated and will be removed in a future version.
     */
    event,

    /**
     * @deprecated Use check({featureId}) instead.
     * This method is deprecated and will be removed in a future version.
     */
    entitled,
    check,
    track,
    openBillingPortal,
  };
};
