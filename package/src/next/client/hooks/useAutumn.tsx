import {
  attachAction,
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
    found: prodChangeFound,
    setProps: setProdChangeDialogProps,
    setOpen: setProdChangeDialogOpen,
  } = prodChangeDialog;

  let {
    found: paywallFound,
    setProps: setPaywallDialogProps,
    setOpen: setPaywallDialogOpen,
  } = paywallDialog;

  const attachWithDialog = async ({
    productId,
    successUrl,
    forceCheckout,
    metadata,
    callback,
  }: AttachParams) => {
    const attachWithoutDialog = async (options?: any) => {
      try {
        await attach({
          dialog: false,
          productId,
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
        title: preview.title,
        message: preview.message,
        items: preview.items,
        dueToday: preview.due_today,
        dueNextCycle: preview.due_next_cycle,
        options: preview.options?.map((option: any) => ({
          featureId: option.feature_id,
          featureName: option.feature_name,
          billingUnits: option.billing_units,
          usageModel: option.usage_model,
          price: option.price,
          tiers: option.tiers,
        })),
        onClick: async (options?: any) => {
          if (!preview.error_on_attach) {
            await attachWithoutDialog(options);
          }
          setProdChangeDialogOpen(false);
        },
      });
    }

    return { data: null, error: null };
  };

  const attach = async ({
    dialog = prodChangeFound || false,
    productId,
    options,
    successUrl,
    forceCheckout,
    metadata,
    callback,
  }: AttachParams) => {
    if (dialog) {
      return await attachWithDialog({
        productId,
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

  const check = async ({
    dialog = paywallFound || false,
    featureId,
    productId,
    requiredQuantity,
    sendEvent,
  }: {
    dialog?: boolean;
    featureId?: string;
    productId?: string;
    requiredQuantity?: number;
    sendEvent?: boolean;
  }) => {
    const res = await checkAction({
      encryptedCustomerId,
      featureId,
      productId,
      requiredQuantity,
      sendEvent,
      withPreview: dialog ? "formatted" : undefined,
    });

    if (res.error) {
      return toClientErrorResponse(res.error);
    }

    let data = res.data;

    if (data && data.preview) {
      let nextActionData = {};
      let preview = data.preview;

      if (preview.upgrade_product_id) {
        nextActionData = {
          onClick: async () => {
            await attach({
              dialog: true,
              productId: preview.upgrade_product_id,
            });
            setPaywallDialogOpen(false);
          },
          buttonText: preview.button_text,
        };
      }
      setPaywallDialogProps({
        title: data.preview.title,
        message: data.preview.message,
        ...nextActionData,
      });
    }

    return data;
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
    value,
  }: {
    featureId: string;
    value?: number;
  }) => {
    const res = await trackAction({
      encryptedCustomerId,
      featureId,
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
