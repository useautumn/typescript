"use client";

import Topbar from "@/components/landing/topbar";
import CustomerDetailsExample from "@/components/landing/billing";
import Intro from "@/components/landing/introduction";
import React, { useState } from "react";
import { useAutumn, useEntity } from "autumn-js/next";
import { Input } from "@/components/ui/input";

export default function Home() {
  const [entityId, setEntityId] = useState<any>("1");
  const { attach, check } = useAutumn();

  return (
    <React.Fragment>
      <Topbar />

      <div className="min-h-screen w-full p-6 flex flex-col gap-8 max-w-7xl mx-auto">
        <Intro number={1} />
        <button
          onClick={async () => {
            const res = await check({
              featureId: "credits",
              requiredBalance: 51,
            });
            console.log(res);
            // attach({
            //   productId: "lite",
            //   openInNewTab: true,
            // });
            // if (entityId === "1") {
            //   console.log("Changing to 3");
            //   setEntityId("3");
            // } else {
            //   console.log("Changing to 1");
            //   setEntityId("1");
            // }
          }}
        >
          Attach
        </button>
      </div>
    </React.Fragment>
  );
}
