"use client";

import React, { useEffect } from "react";
import { useCustomer } from "autumn-js/react";
import { PricingTable } from "@/components/autumn/pricing-table";

export default function Home() {
  const { customer } = useCustomer();

  return (
    <React.Fragment>
      <div className="p-10">
        <div className="max-w-full text-xs overflow-hidden">
          {/* <pre>{JSON.stringify(customer, null, 2)}</pre> */}
        </div>
      </div>
      <PricingTable />
    </React.Fragment>
  );
}
