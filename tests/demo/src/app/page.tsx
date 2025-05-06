"use client";

import { PricingTable } from "@/components/autumn/pricing-table";
import { CommandBar } from "@/components/command";
import { Button } from "@/components/ui/button";
import { useAutumn, useCustomer } from "autumn-js/next";
// import { PricingTable } from "@/components/autumn/pricing-table";

export default function Home() {
  const { customer } = useCustomer();
  const { check } = useAutumn();

  return (
    <div className="p-10 h-screen flex flex-col justify-center items-center gap-10">
      <CommandBar variant="clean" />
      <PricingTable />
      <Button
        onClick={async () => {
          await check({
            featureId: "chat-messages",
          });
        }}
      >
        Send Message
      </Button>
      <p>Messages: {customer?.features["chat-messages"]?.balance}</p>
    </div>
  );
}
