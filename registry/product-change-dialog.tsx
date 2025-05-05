import React from "react";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import {
  PricingDialog,
  PricingDialogTitle,
  Information,
  PriceItem,
  QuantityInput,
  PricingDialogFooter,
  TotalPrice,
  PricingDialogButton,
} from "../nextjs/src/components/pricing/pricing-dialog";

export interface ProductChangeDialogProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  title: string;
  message: string;
  items?: {
    description: string;
    price: string;
  }[];
  dueToday?: {
    price: number;
    currency: string;
  };
  dueNextCycle?: {
    price: number;
    currency: string;
  };
  options?: any;
  onClick: (options?: any) => void;
}
export default function ProductChangeDialog(params?: ProductChangeDialogProps) {
  const [loading, setLoading] = useState(false);
  const [prepaidTotals, setPrepaidTotals] = useState(0);
  const [optionsInput, setOptionsInput] = useState<
    {
      featureId: string;
      featureName: string;
      billingUnits: number;
      quantity?: number;
      price?: string;
    }[]
  >(params?.options || []);

  useEffect(() => {
    let sum = 0;
    optionsInput.forEach((option) => {
      if (option.price && option.quantity) {
        sum += parseFloat(option.price) * option.quantity;
      }
    });
    setPrepaidTotals(sum);
  }, [optionsInput]);

  useEffect(() => {
    setOptionsInput(params?.options || []);
  }, [params?.options]);

  if (!params) {
    return <></>;
  }

  const { open, setOpen, onClick, title, message, items } = params;

  return (
    <PricingDialog open={open} setOpen={setOpen}>
      <PricingDialogTitle>{title}</PricingDialogTitle>
      <Information>{message}</Information>
      {items &&
        items.length > 0 &&
        items.map((item) => {
          const { description, price } = item;
          return (
            <PriceItem key={description}>
              <span>{description}</span>
              <span>{price}</span>
            </PriceItem>
          );
        })}

      {optionsInput.length > 0 &&
        optionsInput.map((option, index) => {
          const { featureName, billingUnits, quantity, price } = option;
          return (
            <PriceItem key={featureName}>
              <span>{featureName}</span>
              <QuantityInput
                key={featureName}
                value={quantity ? quantity / billingUnits : ""}
                onChange={(e) => {
                  const newOptions = [...optionsInput];
                  newOptions[index].quantity =
                    parseInt(e.target.value) * billingUnits;
                  setOptionsInput(newOptions);
                }}
              >
                <span className="text-muted-foreground">
                  × ${price} per {billingUnits === 1 ? " " : billingUnits}{" "}
                  {featureName}
                </span>
              </QuantityInput>
            </PriceItem>
          );
        })}

      <PricingDialogFooter>
        {params.dueToday && (
          <TotalPrice>
            <span>Due Today</span>
            <span>
              {new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: params.dueToday.currency,
              }).format(params.dueToday.price + prepaidTotals)}
            </span>
          </TotalPrice>
        )}
        <PricingDialogButton
          size="sm"
          onClick={async () => {
            setLoading(true);
            try {
              await onClick(optionsInput);
            } catch (error) {
              console.error(error);
            }
            setLoading(false);
          }}
          disabled={loading}
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Confirm"}
        </PricingDialogButton>
      </PricingDialogFooter>
    </PricingDialog>
  );
}
