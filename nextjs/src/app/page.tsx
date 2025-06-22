"use client";

import Topbar from "@/components/landing/topbar";
import React from "react";
import { useAutumn, useCustomer, useEntity } from "autumn-js/react";
import { PricingTable } from "@/components/autumn/pricing-table";
import PaywallDialog from "@/components/autumn/paywall-dialog";

export default function Home() {
  // const { createReferralCode, redeemReferralCode } = useCustomer();
  const { attach, check } = useAutumn();

  return (
    <React.Fragment>
      <Topbar />

      <button
        onClick={async () => {
          const res = await check({
            featureId: "tokens",
            dialog: PaywallDialog,
          });
          console.log(res);
        }}
      >
        Check
      </button>
      <PricingTable />
    </React.Fragment>
  );
}
