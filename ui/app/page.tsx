"use client";

import * as React from "react";

import { useAutumn, useCustomer } from "autumn-js/react";
import { Separator } from "@/components/ui/separator";
import CheckDialog from "@/registry/check-dialog/check-dialog";

export default function Home() {
  const { check } = useAutumn();

  return (
    <div className="h-screen w-screen">
      <div className="max-w-[1000px] mx-auto p-[40px]">
        {/* <PricingTable /> */}
        <button
          onClick={() => {
            check({
              featureId: "messages",
              dialog: CheckDialog,
            });
          }}
        >
          Check
        </button>
        <Separator className="my-8" />
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
  );
}
