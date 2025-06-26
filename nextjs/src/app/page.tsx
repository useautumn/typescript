"use client";

import React, { useEffect } from "react";
import { useCustomer } from "autumn-js/react";
import { PricingTable } from "@/components/autumn/pricing-table";
import { useUser } from "@clerk/nextjs";

const JSONWrapper = ({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) => {
  return (
    <div className="max-w-full text-xs overflow-y-scroll max-h-[350px] border border-zinc-100 p-2">
      <p>{label}</p>
      {children}
    </div>
  );
};

export default function Home() {
  const {
    customer,
    refetch,
    allowed,
    track,
    cancel,
    openBillingPortal,
    attach,
    check,
  } = useCustomer();

  const featureId = "messages";
  return (
    <React.Fragment>
      <div className="p-10">
        <JSONWrapper label="Customer">
          <pre>{JSON.stringify(customer, null, 2)}</pre>
        </JSONWrapper>
        <div>Messages allowed: {allowed({ featureId }) ? "true" : "false"}</div>
        <div className="flex gap-2">
          <button
            onClick={async () => {
              const res = await check({ featureId: "messages" });
              const { data, error } = res;

              console.log(data?.breakdown);
            }}
          >
            Check
          </button>
          <button
            onClick={async () => {
              // attach({ productId: "premium" });
            }}
          >
            Attach
          </button>
          <button
            onClick={async () => {
              await track({
                featureId: "credits",
                value: 2,
              });
              await new Promise((resolve) => setTimeout(resolve, 1000));
              await refetch();
            }}
          >
            Track
          </button>
          <button
            onClick={async () => {
              await cancel({
                productId: "pro",
              });
              await new Promise((resolve) => setTimeout(resolve, 1000));
              await refetch();
            }}
          >
            Cancel
          </button>
          <button
            onClick={async () => {
              await openBillingPortal({
                openInNewTab: true,
                returnUrl: "test",
              });
            }}
          >
            Open Billing Portal
          </button>
        </div>
      </div>
      <PricingTable />
    </React.Fragment>
  );
}
