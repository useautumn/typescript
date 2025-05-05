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

export const useAutumn = () => {
  const { encryptedCustomerId, prodChangeDialog, paywallDialog } =
    useAutumnContext();

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
        console.error(error);
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
      throw error;
    }

    let preview = data.preview;

    if (!preview) {
      await attachWithoutDialog();
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
      await attachWithDialog({
        productId,
        successUrl,
        forceCheckout,
        metadata,
        callback,
      });
      return;
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
      throw result.error;
    }

    let data = result.data;

    if (data?.checkout_url && typeof window !== "undefined") {
      window.open(data.checkout_url, "_blank");
    }

    try {
      await callback?.();
    } catch (error) {
      console.error("Attach callback error", error);
    }

    return result.data;
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
      console.error(res.error);
      return res;
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
      console.error(res.error);
      return res;
    }
    return res.data;
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
      console.error(res.error);
      return res;
    }

    return res.data;
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
      console.error(result.error);
      return result;
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
