"use client";

import { useAutumn } from "autumn-js/next";

import { Button } from "@/components/ui/button";

import PaywallDialog from "@/components/autumn/paywall-dialog";
import { PricingTable } from "@/components/autumn/pricing-table";

export default function PricingPage() {
  // const { attach, check } = useAutumn();

  return (
    <div className="h-screen w-screen overflow-x-hidden flex flex-col gap-10 items-center justify-center">
      <div className="px-10">
        <PricingTable />
      </div>
      <Button
        onClick={async () => {
          // const { data, error } = await check({
          //   featureId: "action",
          //   dialog: PaywallDialog,
          // });
          // console.log(data);
        }}
      >
        Use Action
      </Button>
    </div>
  );
}
