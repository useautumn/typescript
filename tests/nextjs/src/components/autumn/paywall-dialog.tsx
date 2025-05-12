"use client";

import {
  PricingDialog,
  PricingDialogButton,
  PricingDialogFooter,
  PricingDialogTitle,
  Information,
} from "@/components/pricing/pricing-dialog";
import { CheckFeatureFormattedPreview } from "autumn-js";
import { useAutumn } from "autumn-js/next";
import { getPaywallDialogTexts } from "@/lib/autumn/get-paywall-dialog-texts";

export interface PaywallDialogProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  preview: CheckFeatureFormattedPreview;
}

export default function PaywallDialog(params?: PaywallDialogProps) {
  const { attach } = useAutumn();
  if (!params || !params.preview) {
    return <></>;
  }

  const { open, setOpen } = params;
  const { products } = params.preview;
  const { title, message } = getPaywallDialogTexts(params.preview);

  return (
    <PricingDialog open={open} setOpen={setOpen}>
      <PricingDialogTitle>{title}</PricingDialogTitle>
      <Information className="mb-2">{message}</Information>
      <PricingDialogFooter>
        <PricingDialogButton
          size="sm"
          className="font-medium shadow transition min-w-20"
          onClick={async () => {
            if (products.length > 0) {
              await attach({
                productId: products[0].id,
              });
            }
          }}
        >
          {products.length > 0
            ? `Upgrade to ${products[0].name}`
            : "Contact Us"}
        </PricingDialogButton>
      </PricingDialogFooter>
    </PricingDialog>
  );
}
