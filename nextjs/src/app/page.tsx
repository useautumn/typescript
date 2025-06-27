"use client";

import React, { useEffect } from "react";
import {
  ProductDetails,
  useCustomer,
  PricingTable as ReactPricingTable,
} from "autumn-js/react";

// import PricingTable from "@/components/autumn/pricing-table";

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

const productDetails: ProductDetails[] = [
  {
    id: "premium",
    description: "Only for cool people",
    buttonText: "Upgrade",
    everythingFrom: "Hobby",
    price: {
      primaryText: "$10",
      secondaryText: "/month",
    },
    items: [
      {
        featureId: "messages",
        // primaryText: "1000 messages",
      },
    ],
  },
  {
    name: "Enterprise",
    description: "Pro plan",
    buttonText: "Upgrade",
    everythingFrom: "Hobby",
    price: {
      primaryText: "Contact Us",
    },
    items: [
      {
        featureId: "messages",
        primaryText: "1000 messages",
      },
      {
        featureId: "credits",
        primaryText: "1000 credits",
      },
    ],
    buttonUrl: "https://www.google.com",
  },
];

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

  const featureId = "words";
  return (
    <React.Fragment>
      <div className="p-10">
        <ReactPricingTable />
      </div>

      <div className="p-10">
        <JSONWrapper label="Customer">
          <pre>{JSON.stringify(customer, null, 2)}</pre>
        </JSONWrapper>
        <div>
          {featureId} allowed: {allowed({ featureId }) ? "true" : "false"}
        </div>
        <div className="flex gap-2">
          <button
            onClick={async () => {
              const res = await check({ featureId: "messages" });
              const { data, error } = res;
              console.log(data, error);
            }}
          >
            Check
          </button>
          <button
            onClick={async () => {
              attach({ productId: "premium" });
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
    </React.Fragment>
  );
}
