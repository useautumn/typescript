import { AttachResult, CheckResult } from "../../../sdk";
import { AutumnContextParams, useAutumnContext } from "../AutumnContext";
import {
  AttachParams,
  CancelParams,
  CheckParams,
  OpenBillingPortalParams,
  TrackParams,
} from "../client/types/clientGenTypes";
import { AutumnPromise } from "../../../sdk";
import { usePricingTable } from "./usePricingTable";
import { useContext } from "react";

export const useAutumnBase = ({
  AutumnContext,
}: {
  AutumnContext: React.Context<AutumnContextParams>;
}) => {
  const context = useContext(AutumnContext);
  const { prodChangeDialog, paywallDialog } = context;

  const client = context.client;
  const { refetch: refetchPricingTable } = usePricingTable();

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

  const attachWithDialog = async (
    params: AttachParams
  ): AutumnPromise<AttachResult | CheckResult> => {
    let { dialog, ...rest } = params;

    const { productId, entityId, entityData } = params;

    const checkRes = await client.check({
      productId,
      entityId,
      entityData,
      withPreview: true,
    });

    if (checkRes.error) {
      return checkRes;
    }

    let preview = checkRes.data.preview;

    if (!preview) {
      return await attach(rest);
    } else {
      setProdChangeDialogProps({
        preview,
      });
      setProdChangeDialogOpen(true);
    }

    return checkRes;
  };

  const attach = async (params: AttachParams) => {
    const { dialog, openInNewTab } = params;

    if (dialog) {
      setProdChangeComponent(dialog);
      return await attachWithDialog(params);
    }

    const result = await client.attach(params);

    if (result.error) {
      return result;
    }

    let data = result.data;

    if (data?.checkout_url && typeof window !== "undefined") {
      if (openInNewTab) {
        window.open(data.checkout_url, "_blank");
      } else {
        window.location.href = data.checkout_url;
      }
    }

    await refetchPricingTable();

    if (setProdChangeDialogOpen) {
      setProdChangeDialogOpen(false);
    }

    return result;
  };

  const cancel = async (params: CancelParams) => {
    const res = await client.cancel(params);

    if (res.error) {
      return res;
    }

    return res;
  };

  const check = async (params: CheckParams) => {
    let { dialog, withPreview } = params;

    if (dialog) {
      setPaywallComponent(dialog);
    }

    const res = await client.check({
      ...params,
      withPreview: withPreview || dialog ? true : false,
    });

    if (res.error) {
      return res;
    }

    let data = res.data;

    if (data && data.preview && dialog) {
      let preview = data.preview;
      setPaywallDialogProps({ preview });
      setPaywallDialogOpen(true);
    }

    return res;
  };

  const track = async (params: TrackParams) => {
    const res = await client.track(params);

    if (res.error) {
      return res;
    }

    return res;
  };

  const openBillingPortal = async (params?: OpenBillingPortalParams) => {
    const res = await client.openBillingPortal(params);

    if (res.error) {
      return res;
    }

    let data = res.data;

    if (data?.url && typeof window !== "undefined") {
      window.open(data.url, "_blank");
      return res;
    } else {
      return res;
    }
  };

  return {
    attach,
    check,
    track,
    cancel,
    openBillingPortal,
  };
};
