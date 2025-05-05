"use client";

import * as React from "react";

import { PricingTable } from "@/registry/pricing-table";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { useAutumn } from "autumn-js/next";

export default function Home() {
  const { check } = useAutumn();
  return (
    <div className="h-screen w-screen">
      <div className="max-w-[1000px] mx-auto p-[40px]">
        <PricingTable />
        <Separator className="my-8" />
        <div className="flex justify-center w-full">
          <Button
            onClick={async () => {
              const res = await check({ featureId: "chat-messages" });
              console.log(res);
            }}
          >
            Use chat message
          </Button>
        </div>
      </div>
    </div>
  );
}
