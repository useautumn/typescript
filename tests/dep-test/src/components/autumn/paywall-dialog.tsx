"use client";
import React, { useState } from "react";
import { Loader2 } from "lucide-react";
import {
  PricingDialog,
  PricingDialogButton,
  PricingDialogFooter,
  PricingDialogTitle,
  Information,
} from "@/components/pricing/pricing-dialog";

export interface PaywallDialogProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  title: string;
  message: string;
  onClick: () => Promise<void>;
  buttonText?: string;
}
export default function AutumnPaywall(params?: PaywallDialogProps) {
  const [loading, setLoading] = useState(false);

  if (!params) {
    return <></>;
  }

  const { open, setOpen, title, message, onClick, buttonText } = params;

  return (
    <PricingDialog open={open} setOpen={setOpen}>
      <PricingDialogTitle>{title || "Feature Unavailable"}</PricingDialogTitle>
      <Information className="mb-2">{message}</Information>
      <PricingDialogFooter>
        <PricingDialogButton
          size="sm"
          className="font-medium shadow transition min-w-20"
          onClick={async () => {
            setLoading(true);
            try {
              await onClick();
            } catch (error) {
              console.error(error);
            }
            setLoading(false);
          }}
          disabled={loading}
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          {buttonText || "Confirm"}
        </PricingDialogButton>
      </PricingDialogFooter>
    </PricingDialog>
  );
}
