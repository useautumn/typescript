"use client";

import * as React from "react";

import { useAutumn, useCustomer } from "autumn-js/react";
import PricingTable from "@/registry/pricing-table/pricing-table";

const productDetails = [
  {
    id: "free",
    name: "Free",
    description: "For personal projects.",
    price: {
      primaryText: "Free",
      secondaryText: "up to 3 users",
    },
    buttonText: "Start deploying",
  },
  {
    id: "pro",
    name: "Pro",
    description:
      "For teams building production applications and everything is crazy and hard and stuff",
    recommendText: "Best Value",

    price: {
      primaryText: "$19",
      secondaryText: "per user/month plus compute costs*",
    },

    buttonText: "Select plan",
    everythingFrom: "Hobby",
    items: [
      {
        featureId: "analytics",
      },
      {
        primaryText: "10 team members included",
        secondaryText: "Then $20 per member",
      },
      {
        primaryText: "500 GB of bandwidth included",
      },
    ],
  },
  {
    name: "Enterprise",
    description: "For mission critical applications with complex needs.",
    price: {
      primaryText: "Custom",
      secondaryText: "pricing for your team",
      interval: "year",
    },
    buttonText: "Get in touch",
    everythingFrom: "Organization",
    items: [
      {
        primaryText: "Centralized team management",
      },
      {
        primaryText: "Guest users",
      },
    ],
  },
];

export default function Home() {
  return (
    <div className="w-screen ">
      <div className="flex justify-center items-center h-full w-full bg-background">
        <div className="max-w-[1000px] mx-auto p-[40px] border w-full h-full">
          <PricingTable productDetails={productDetails} />
          {/* <PricingTable />
        <Separator className="my-8" /> */}
          {/* <div className="flex justify-center w-full">
          <Button
            onClick={async () => {
              const res = await check({ featureId: "chat-messages" });
              console.log(res);
            }}
          >
            Use chat message
          </Button>
          </div> */}
        </div>
      </div>
    </div>
  );
}
