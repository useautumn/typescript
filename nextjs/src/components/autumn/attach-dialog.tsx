"use client";

import React, { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ArrowRight, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";
import { getAttachContent } from "@/lib/autumn/attach-content";
import type {
  AttachFeatureOptions,
  CheckoutResult,
  ProductItem,
} from "autumn-js";
import { useCustomer } from "autumn-js/react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export interface AttachDialogProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  preview: CheckoutResult;
  onClick: (options?: AttachFeatureOptions) => Promise<void>;
}

export default function AttachDialog(params?: AttachDialogProps) {
  const { attach } = useCustomer();
  const [loading, setLoading] = useState(false);
  // const [optionsInput, setOptionsInput] = useState<FeatureOption[]>(
  //   params?.preview?.options || []
  // );

  if (!params || !params.preview) {
    return <></>;
  }

  const { open, setOpen, preview } = params;
  const { title, message } = getAttachContent(preview);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        className={cn("p-0 pt-4 gap-0 text-foreground overflow-hidden text-sm")}
      >
        <DialogTitle className={cn("px-6 mb-1 ")}>{title}</DialogTitle>
        <div className={cn("px-6 mt-1 mb-4 text-muted-foreground")}>
          {message}
        </div>
        <div className="px-6 mb-4 flex flex-col gap-2">
          <p className="au-text-sm au-font-medium">Price</p>
          {preview.product.items
            .filter((item) => item.type !== "feature")
            .map((item, index) => {
              if (item.usage_model == "prepaid") {
                return (
                  <div key={index} className="flex justify-between">
                    <p className="text-muted-foreground">
                      {item.feature ? item.feature.name : "Subscription"}
                    </p>
                    <p>{item.display?.secondary_text}</p>
                  </div>
                );
              }

              return (
                <div key={index} className="flex justify-between">
                  <p className="text-muted-foreground">
                    {item.feature ? item.feature.name : "Subscription"}
                  </p>
                  <p>
                    {item.display?.primary_text} {item.display?.secondary_text}
                  </p>
                </div>
              );
            })}
        </div>

        <DialogFooter className="flex flex-col sm:flex-row justify-between gap-x-4 py-2 pl-6 pr-3 bg-secondary border-t shadow-inner">
          {/* {due_today && (
            <TotalPrice>
              <span>Due Today</span>
              <span>
                {new Intl.NumberFormat("en-US", {
                  style: "currency",
                  currency: due_today.currency,
                }).format(getTotalPrice())}
              </span>
            </TotalPrice>
          )} */}
          <Button
            size="sm"
            onClick={async () => {
              setLoading(true);
              await attach({
                productId: preview.product.id,
                options: [],
              });
              setOpen(false);
              setLoading(false);
            }}
            disabled={loading}
            className="min-w-16 flex items-center gap-2"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <span className="whitespace-nowrap flex gap-1">Confirm</span>
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

const FixedPrice = ({ item }: { item: ProductItem }) => {
  return (
    <div className="flex justify-between">
      <p>Subscription</p>
      <p>
        {item.display?.primary_text} {item.display?.secondary_text}
      </p>
    </div>
  );
};

export const PriceItem = ({
  children,
  className,
  ...props
}: {
  children: React.ReactNode;
  className?: string;
} & React.HTMLAttributes<HTMLDivElement>) => {
  return (
    <div
      className={cn(
        "flex flex-col pb-4 sm:pb-0 gap-1 sm:flex-row justify-between sm:h-7 sm:gap-2 sm:items-center",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

interface FeatureOption {
  feature_id: string;
  feature_name: string;
  billing_units: number;
  price?: number;
  quantity?: number;
}

interface FeatureOptionWithRequiredPrice
  extends Omit<FeatureOption, "price" | "quantity"> {
  price: number;
  quantity: number;
}

export const OptionsInput = ({
  className,
  option,
  optionsInput,
  setOptionsInput,
  index,
  ...props
}: {
  className?: string;
  option: FeatureOptionWithRequiredPrice;
  optionsInput: FeatureOption[];
  setOptionsInput: (options: FeatureOption[]) => void;
  index: number;
} & React.HTMLAttributes<HTMLDivElement>) => {
  const { feature_name, billing_units, quantity, price } = option;
  return (
    <PriceItem key={feature_name}>
      <span>{feature_name}</span>
      <QuantityInput
        key={feature_name}
        value={quantity ? quantity / billing_units : ""}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
          const newOptions = [...optionsInput];
          newOptions[index].quantity = parseInt(e.target.value) * billing_units;
          setOptionsInput(newOptions);
        }}
      >
        <span className="">
          × ${price} per {billing_units === 1 ? " " : billing_units}{" "}
          {feature_name}
        </span>
      </QuantityInput>
    </PriceItem>
  );
};

export const QuantityInput = ({
  children,
  onChange,
  value,
  className,
  ...props
}: {
  children: React.ReactNode;
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  className?: string;
} & React.HTMLAttributes<HTMLDivElement>) => {
  const currentValue = Number(value) || 0;

  const handleValueChange = (newValue: number) => {
    const syntheticEvent = {
      target: { value: String(newValue) },
    } as React.ChangeEvent<HTMLInputElement>;
    onChange(syntheticEvent);
  };

  return (
    <div
      className={cn(className, "flex flex-row items-center gap-4")}
      {...props}
    >
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="icon"
          onClick={() =>
            currentValue > 0 && handleValueChange(currentValue - 1)
          }
          disabled={currentValue <= 0}
          className="h-6 w-6 pb-0.5"
        >
          -
        </Button>
        <span className="w-8 text-center text-foreground">{currentValue}</span>
        <Button
          variant="outline"
          size="icon"
          onClick={() => handleValueChange(currentValue + 1)}
          className="h-6 w-6 pb-0.5"
        >
          +
        </Button>
      </div>
      {children}
    </div>
  );
};

export const TotalPrice = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="w-full font-semibold flex justify-between items-center">
      {children}
    </div>
  );
};

export const PricingDialogButton = ({
  children,
  size,
  onClick,
  disabled,
  className,
}: {
  children: React.ReactNode;
  size?: "sm" | "lg" | "default" | "icon";
  onClick: () => void;
  disabled?: boolean;
  className?: string;
}) => {
  return (
    <Button
      onClick={onClick}
      disabled={disabled}
      size={size}
      className={cn(className, "shadow-sm shadow-stone-400")}
    >
      {children}
      <ArrowRight className="!h-3" />
    </Button>
  );
};
