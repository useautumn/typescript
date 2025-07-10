"use client";

import React, { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
// import { ArrowRight } from "lucide-react";
import { type CheckProductPreview } from "@sdk";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";
import { getAttachContent } from "./lib/attach-content";
import { useCustomer } from "@/index";

export interface AttachDialogProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  preview: CheckProductPreview;
  onClick: (options?: any) => Promise<void>;
}

export default function AttachDialog(params?: AttachDialogProps) {
  const { attach } = useCustomer();
  const [loading, setLoading] = useState(false);
  const [optionsInput, setOptionsInput] = useState<FeatureOption[]>(
    params?.preview?.options || [],
  );

  const getTotalPrice = () => {
    let sum = due_today?.price || 0;
    optionsInput.forEach((option) => {
      if (option.price && option.quantity) {
        sum += option.price * (option.quantity / option.billing_units);
      }
    });
    return sum;
  };

  useEffect(() => {
    setOptionsInput(params?.preview?.options || []);
  }, [params?.preview?.options]);

  if (!params || !params.preview) {
    return <></>;
  }

  const { open, setOpen, preview } = params;
  const { items, due_today } = preview;
  const { title, message } = getAttachContent(preview);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        className={cn(
          "au-p-0 au-pt-4 au-gap-0 au-text-foreground au-overflow-hidden au-text-sm",
        )}
      >
        <DialogTitle className={cn("au-px-6 au-mb-1 ")}>{title}</DialogTitle>
        <div className={cn("au-px-6 au-mt-1 au-mb-4 au-text-muted-foreground")}>
          {message}
        </div>
        {(items || optionsInput.length > 0) && (
          <div className="au-mb-6 au-px-6">
            {items?.map((item) => (
              <PriceItem key={item.description}>
                <span className="au-truncate au-flex-1">
                  {item.description}
                </span>
                <span>{item.price}</span>
              </PriceItem>
            ))}

            {optionsInput?.map((option, index) => {
              return (
                <OptionsInput
                  key={option.feature_name}
                  option={option as FeatureOptionWithRequiredPrice}
                  optionsInput={optionsInput}
                  setOptionsInput={setOptionsInput}
                  index={index}
                />
              );
            })}
          </div>
        )}

        <DialogFooter className="au-flex au-flex-col sm:au-flex-row au-justify-between au-gap-x-4 au-py-2 au-pl-6 au-pr-3 au-bg-secondary au-border-t au-shadow-inner">
          {due_today && (
            <TotalPrice>
              <span>Due Today</span>
              <span>
                {new Intl.NumberFormat("en-US", {
                  style: "currency",
                  currency: due_today.currency,
                }).format(getTotalPrice())}
              </span>
            </TotalPrice>
          )}
          <Button
            size="sm"
            onClick={async () => {
              setLoading(true);
              await attach({
                productId: preview.product_id,
                options: optionsInput.map((option) => ({
                  featureId: option.feature_id,
                  quantity: option.quantity || 0,
                })),
              });
              setOpen(false);
              setLoading(false);
            }}
            disabled={loading}
            className="au-min-w-16 au-flex au-items-center au-gap-2"
          >
            {/* {loading ? (
              <Loader2 className="au-w-4 au-h-4 au-animate-spin" />
            ) : (
              <>
                <span className="au-whitespace-nowrap au-flex au-gap-1">
                  Confirm
                </span>
              </>
            )} */}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

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
        "au-flex au-flex-col au-pb-4 sm:au-pb-0 au-gap-1 sm:au-flex-row au-justify-between sm:au-h-7 sm:au-gap-2 sm:au-items-center",
        className,
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
      className={cn(className, "au-flex au-flex-row au-items-center au-gap-4")}
      {...props}
    >
      <div className="au-flex au-items-center au-gap-1">
        <Button
          variant="outline"
          size="icon"
          onClick={() =>
            currentValue > 0 && handleValueChange(currentValue - 1)
          }
          disabled={currentValue <= 0}
          className="au-h-6 au-w-6 au-pb-0.5"
        >
          -
        </Button>
        <span className="au-w-8 au-text-center au-text-foreground">
          {currentValue}
        </span>
        <Button
          variant="outline"
          size="icon"
          onClick={() => handleValueChange(currentValue + 1)}
          className="au-h-6 au-w-6 au-pb-0.5"
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
    <div className="au-w-full au-font-semibold au-flex au-justify-between au-items-center">
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
      className={cn(className, "au-shadow-sm au-shadow-stone-400")}
    >
      {children}
      {/* <ArrowRight className="!au-h-3" /> */}
    </Button>
  );
};
