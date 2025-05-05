"use client";
import { PricingTable } from "@/components/autumn/pricing-table";
import { Button } from "@/components/ui/button";
import { useAutumn, useCustomer, usePricingTable } from "autumn-js/next";

export default function Home() {
  const { error, customer } = useCustomer();
  const { check } = useAutumn();

  if (error) {
    console.error("(Autumn) Error:", error);
    return <div>Error: {error.message}</div>;
  }

  return (
    <div className="p-10 flex flex-col gap-4">
      <h1>
        Customer {customer?.email} ({customer?.id})
      </h1>
      <PricingTable />
      <Button
        className="w-fit"
        onClick={async () => {
          const result = await check({
            featureId: "chat-messages",
          });
          console.log("Result", result);
        }}
      >
        Open Dialog
      </Button>
    </div>
  );
}
