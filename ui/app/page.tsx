"use client";

import * as React from "react";

import { useAutumn, useCustomer } from "autumn-js/react";

export default function Home() {
  const { check } = useAutumn();
  const { customer } = useCustomer();

  return (
    <div className="h-screen w-screen">
      <div className="max-w-[1000px] mx-auto p-[40px]">
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
  );
}
