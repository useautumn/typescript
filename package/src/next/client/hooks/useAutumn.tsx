import {
  attachAction,
  cancelAction,
  checkAction,
  entitledAction,
  getBillingPortalAction,
  sendEventAction,
  trackAction,
} from "../../server/genActions";

import { useAutumnContext } from "../AutumnContext";
import { AttachParams } from "./types";
import { useCustomer } from "./useCustomer";
import { fetchPricingTableData, toClientErrorResponse } from "../clientUtils";

export const useAutumn = () => {
  const {
    encryptedCustomerId,
    prodChangeDialog,
    paywallDialog,
    pricingTableProducts,
    setPricingTableProducts,
  } = useAutumnContext();

  const { customer, isLoading: loading, error, refetch } = useCustomer();

  let {
    setProps: setProdChangeDialogProps,
    setOpen: setProdChangeDialogOpen,
    setComponent: setProdChangeComponent,
  } = prodChangeDialog;

  let {
    setProps: setPaywallDialogProps,
    setOpen: setPaywallDialogOpen,
    setComponent: setPaywallComponent,
  } = paywallDialog;

  const attachWithDialog = async ({
    productId,
    entityId,
    successUrl,
    forceCheckout,
    metadata,
    callback,
  }: AttachParams) => {
    const attachWithoutDialog = async (options?: any) => {
      try {
        await attach({
          productId,
          entityId,
          options,
          successUrl,
          forceCheckout,
          metadata,
        });
      } catch (error) {
        return toClientErrorResponse(error);
      } finally {
        await callback?.();
      }
    };

    // 1. Check product

    const { data, error } = await checkAction({
      encryptedCustomerId,
      productId,
      entityId,
      withPreview: "formatted",
    });

    if (error) {
      return toClientErrorResponse(error);
    }

    let preview = data.preview;

    if (!preview) {
      return await attachWithoutDialog();
    } else {
      setProdChangeDialogProps({
        preview,
      });
      setProdChangeDialogOpen(true);
    }

    return { data: null, error: null };
  };

  const attach = async ({
    productId,
    entityId,
    options,
    successUrl,
    forceCheckout,
    metadata,
    dialog,
    callback,
  }: AttachParams) => {
    if (dialog) {
      setProdChangeComponent(dialog);

      return await attachWithDialog({
        productId,
        entityId,
        successUrl,
        forceCheckout,
        metadata,
        callback,
      });
    }

    let snakeOptions =
      options?.map((option) => ({
        feature_id: option.featureId,
        quantity: option.quantity,
      })) || undefined;

    const result = await attachAction({
      encryptedCustomerId,
      productId,
      entityId,
      options: snakeOptions,
      successUrl,
      forceCheckout,
      metadata,
    });

    if (result.error) {
      return toClientErrorResponse(result.error);
    }

    let data = result.data;

    if (data?.checkout_url && typeof window !== "undefined") {
      window.open(data.checkout_url, "_blank");
    }

    try {
      await callback?.();
    } catch (error) {
      return toClientErrorResponse(error);
    }

    if (pricingTableProducts) {
      try {
        await fetchPricingTableData({
          setProducts: setPricingTableProducts,
          encryptedCustomerId,
        });
      } catch (error) {
        console.warn("Failed to fetch pricing table data");
        console.warn(error);
      }
    }

    return result;
  };

  const cancel = async ({
    productId,
    entityId,
  }: {
    productId: string;
    entityId?: string;
  }) => {
    const res = await cancelAction({
      encryptedCustomerId,
      productId,
      entityId,
    });

    if (res.error) {
      return toClientErrorResponse(res.error);
    }

    return res;
  };

  const check = async ({
    featureId,
    productId,
    entityId,
    requiredQuantity,
    sendEvent,
    withPreview,
    dialog,
  }: {
    featureId?: string;
    productId?: string;
    entityId?: string;
    requiredQuantity?: number;
    sendEvent?: boolean;
    withPreview?: "formatted" | "raw";
    dialog?: (data: any) => JSX.Element | React.ReactNode;
  }) => {
    if (dialog) {
      setPaywallComponent(dialog);
    }

    const res = await checkAction({
      encryptedCustomerId,
      featureId,
      productId,
      entityId,
      requiredQuantity,
      sendEvent,
      withPreview: dialog ? "formatted" : withPreview,
    });

    if (res.error) {
      return toClientErrorResponse(res.error);
    }

    let data = res.data;

    if (data && data.preview && dialog) {
      let preview = data.preview;

      setPaywallDialogProps({
        preview,
      });

      setPaywallDialogOpen(true);
    }

    return res;
  };

  /**
   * @deprecated Use check({featureId}) instead.
   * This method is deprecated and will be removed in a future version.
   */
  const entitled = async ({ featureId }: { featureId: string }) => {
    const res = await entitledAction({
      encryptedCustomerId,
      featureId,
    });

    if (res.error) {
      return toClientErrorResponse(res.error);
    }

    return res;
  };

  const track = async ({
    featureId,
    entityId,
    value,
  }: {
    featureId: string;
    entityId?: string;
    value?: number;
  }) => {
    const res = await trackAction({
      encryptedCustomerId,
      featureId,
      entityId,
      value,
    });

    if (res.error) {
      return toClientErrorResponse(res.error);
    }

    return res;
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
      return toClientErrorResponse(error);
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
      return toClientErrorResponse(result.error);
    }

    let data = result.data;

    if (data?.url && typeof window !== "undefined") {
      window.open(data.url, "_blank");
      return result;
    } else {
      return result;
    }
  };

  // 2. Create a client
  return {
    attach,
    check,
    track,
    cancel,
    openBillingPortal,
    // Deprecated

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

    /**
     * @deprecated Use the useCustomer() hook instead.
     * This property is deprecated and will be removed in a future version.
     */
    customer,

    /**
     * @deprecated Use the useCustomer() hook instead.
     * This property is deprecated and will be removed in a future version.
     */
    loading,

    /**
     * @deprecated Use the useCustomer() hook instead.
     * This property is deprecated and will be removed in a future version.
     */
    error,

    /**
     * @deprecated Use the useCustomer() hook instead.
     * This property is deprecated and will be removed in a future version.
     */
    refetch,
  };
};
