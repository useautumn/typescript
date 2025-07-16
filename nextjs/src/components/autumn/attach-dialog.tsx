"use client";

import React, { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  ChevronDown,
  ChevronDownIcon,
  ChevronRight,
  Loader2,
} from "lucide-react";
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
  CheckResult,
  ProductItem,
} from "autumn-js";
import { useCustomer } from "autumn-js/react";

import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Input } from "../ui/input";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../ui/accordion";
import * as AccordionPrimitive from "@radix-ui/react-accordion";

export interface AttachDialogProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  preview: CheckoutResult;
  onClick: (options?: AttachFeatureOptions) => Promise<void>;
}

export default function AttachDialog(params?: AttachDialogProps) {
  const { attach } = useCustomer();
  const [checkoutResult, setCheckoutResult] = useState<
    CheckoutResult | undefined
  >(params?.preview);

  useEffect(() => {
    if (params?.preview) {
      setCheckoutResult(params?.preview);
    }
  }, [params?.preview]);

  const [loading, setLoading] = useState(false);

  if (!params || !params.preview) {
    return <></>;
  }

  const { open, setOpen, preview } = params;
  const { title, message } = getAttachContent(preview);

  const isFree = checkoutResult?.product.properties?.is_free;

  console.log("Product properties:", checkoutResult?.product.properties);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        className={cn("p-0 pt-4 gap-0 text-foreground overflow-hidden text-sm")}
      >
        <DialogTitle className={cn("px-6 mb-1 ")}>{title}</DialogTitle>
        <div className={cn("px-6 mt-1 mb-4 text-muted-foreground")}>
          {message}
        </div>

        {isFree === false && checkoutResult && (
          <PriceInformation
            checkoutResult={checkoutResult}
            setCheckoutResult={setCheckoutResult}
          />
        )}

        <DialogFooter className="flex flex-col sm:flex-row justify-between gap-x-4 py-2 pl-6 pr-3 bg-secondary border-t shadow-inner">
          <Button
            size="sm"
            onClick={async () => {
              setLoading(true);
              await attach({
                productId: preview.product.id,
                options: checkoutResult?.options,
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

function PriceInformation({
  checkoutResult,
  setCheckoutResult,
}: {
  checkoutResult: CheckoutResult;
  setCheckoutResult: (checkoutResult: CheckoutResult) => void;
}) {
  return (
    <div className="px-6 mb-4 flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <p className="au-text-sm au-font-medium">Price</p>
        {checkoutResult?.product.items
          .filter((item) => item.type !== "feature")
          .map((item, index) => {
            if (item.usage_model == "prepaid") {
              return (
                <PrepaidItem
                  key={index}
                  item={item}
                  checkoutResult={checkoutResult!}
                  setCheckoutResult={setCheckoutResult}
                />
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

      <div className="flex flex-col gap-2">
        {/* <p className="font-medium">Due Today</p> */}

        <div className="flex justify-between">
          <p className="font-medium text-md">Total due today</p>

          <p className="font-medium text-md">
            {new Intl.NumberFormat("en-US", {
              style: "currency",
              currency: checkoutResult?.currency,
            }).format(checkoutResult?.total)}
          </p>
        </div>
        <Accordion type="single" collapsible>
          <AccordionItem value="total">
            <CustomAccordionTrigger className="justify-between w-full my-0 py-0">
              <div className="cursor-pointer flex items-center gap-1 w-full justify-end">
                <p className="font-light text-muted-foreground">View details</p>
                <ChevronDown
                  className="text-muted-foreground mt-1 rotate-90 transition-transform duration-200 ease-in-out"
                  size={14}
                />
              </div>

              {/* <ChevronDownIcon className="text-muted-foreground pointer-events-none size-4 shrink-0 translate-y-0.5 transition-transform duration-200" /> */}
            </CustomAccordionTrigger>
            <AccordionContent className="my-2 flex flex-col gap-2">
              {checkoutResult?.lines
                .filter((line) => line.amount != 0)
                .map((line, index) => {
                  return (
                    <div key={index} className="flex justify-between">
                      <p className="text-muted-foreground">
                        {line.description}
                      </p>
                      <p className="text-muted-foreground">
                        {new Intl.NumberFormat("en-US", {
                          style: "currency",
                          currency: checkoutResult?.currency,
                        }).format(line.amount)}
                      </p>
                    </div>
                  );
                })}
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </div>
  );
}

function CustomAccordionTrigger({
  className,
  children,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Trigger>) {
  return (
    <AccordionPrimitive.Header className="flex">
      <AccordionPrimitive.Trigger
        data-slot="accordion-trigger"
        className={cn(
          "focus-visible:border-ring focus-visible:ring-ring/50 flex flex-1 items-start justify-between gap-4 rounded-md py-4 text-left text-sm font-medium transition-all outline-none focus-visible:ring-[3px] disabled:pointer-events-none disabled:opacity-50 [&[data-state=open]_svg]:rotate-0",
          className
        )}
        {...props}
      >
        {children}
      </AccordionPrimitive.Trigger>
    </AccordionPrimitive.Header>
  );
}

const PrepaidItem = ({
  item,
  checkoutResult,
  setCheckoutResult,
}: {
  item: ProductItem;
  checkoutResult: CheckoutResult;
  setCheckoutResult: (checkoutResult: CheckoutResult) => void;
}) => {
  const { quantity = 0, billing_units: billingUnits = 1 } = item;
  const [quantityInput, setQuantityInput] = useState<string>(
    (quantity / billingUnits).toString()
  );
  const { checkout } = useCustomer();
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    try {
      const newOptions = [...checkoutResult.options].filter(
        (option) => option.feature_id !== item.feature_id
      );
      newOptions.push({
        featureId: item.feature_id,
        quantity: Number(quantityInput) * billingUnits,
      });
      const { data, error } = await checkout({
        productId: checkoutResult.product.id,
        options: newOptions,
      });

      if (error) {
        console.error(error);
        return;
      }
      setCheckoutResult(data!);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
      setOpen(false);
    }
  };

  return (
    <div className="flex justify-between">
      <div className="flex gap-2">
        <p className="text-muted-foreground">{item.feature?.name}</p>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger
            className="text-muted-foreground text-xs px-1 py-0.5 rounded-md flex items-center gap-1
             bg-accent/80 hover:bg-accent hover:text-foreground"
          >
            Qty: {quantity}
            <ChevronDown size={12} />
          </PopoverTrigger>
          <PopoverContent
            align="start"
            className="w-80 text-sm p-4 pt-3 flex flex-col gap-4"
          >
            <div className="flex flex-col gap-1">
              <p className="text-sm font-medium">{item.feature?.name}</p>
              <p className="text-muted-foreground">
                {item.display?.primary_text} {item.display?.secondary_text}
              </p>
            </div>

            <div className="flex justify-between items-end">
              <div className="flex gap-2 items-center">
                <Input
                  className="h-7 w-16 focus:!ring-2"
                  value={quantityInput}
                  onChange={(e) => setQuantityInput(e.target.value)}
                />
                <p className="text-muted-foreground">
                  {billingUnits > 1 && `x ${billingUnits} `}
                  {item.feature?.name}
                </p>
              </div>

              <Button onClick={handleSave} className="w-14">
                {loading ? (
                  <Loader2 className="text-muted-foreground animate-spin !w-4 !h-4" />
                ) : (
                  "Save"
                )}
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      </div>
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
