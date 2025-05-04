"use client";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import {
  PricingDialog,
  PricingDialogButton,
  PricingDialogFooter,
  PricingDialogTitle,
  Information,
} from "./pricing-dialog";
import { PricingTable, PricingCard } from "./pricing-table";

const products = [
  {
    id: "hobby",
    name: "Hobby",
    description: "For personal projects and small-scale applications.",
    price: {
      primaryText: "Free",
      secondaryText: "up to 3 users",
    },
    buttonText: "Start deploying",
    items: [
      {
        primaryText: "Deploy full-stack apps in minutes",
      },
      {
        primaryText: "Fully-managed datastores",
      },
      {
        primaryText: "Custom domains",
      },
      {
        primaryText: "Global CDN & regional hosting",
      },
      {
        primaryText: "Get security out of the box",
      },
      {
        primaryText: "Email support",
      },
    ],
  },
  {
    id: "pro",
    name: "Professional",
    description: "For teams building production applications.",
    // recommendedText: "Best Value",
    price: {
      primaryText: "$19",
      secondaryText: "per user/month plus compute costs*",
    },
    priceAnnual: {
      primaryText: "$190",
      secondaryText: "per user/year plus compute costs*",
    },
    buttonText: "Select plan",
    everythingFrom: "Hobby",
    items: [
      {
        primaryText: "10 team members included",
        secondaryText: "Then $20 per member",
      },
      {
        primaryText: "500 GB of bandwidth included",
      },
      {
        primaryText: "Unlimited projects & environments",
      },
      {
        primaryText: "Horizontal autoscaling",
      },
      {
        primaryText: "Test with preview environments",
      },
      {
        primaryText: "Isolated environments",
      },
    ],
  },
];

export interface PaywallDialogProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  title: string;
  message: string;
  onClick: () => void;
  buttonText?: string;
}
export default function PaywallDialog(params?: PaywallDialogProps) {
  const [loading, setLoading] = useState(false);

  if (!params) {
    return <></>;
  }

  const { open, setOpen, title, message, onClick, buttonText } = params;

  return (
    <PricingDialog open={open} setOpen={setOpen}>
      <PricingDialogTitle>{title || "Feature Unavailable"}</PricingDialogTitle>
      <Information className="mb-2">{message}</Information>
      {/* <PricingTable
        showFeatures={false}
        products={products}
        className="px-6 mb-8"
      >
        <PricingCard productId="pro" />
      </PricingTable> */}
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
