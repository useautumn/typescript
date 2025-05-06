"use client";

import { CommandBar } from "@/components/command";
import { useCustomer } from "autumn-js/next";
// import { PricingTable } from "@/components/autumn/pricing-table";

export default function Home() {
  const { customer, isLoading } = useCustomer();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="p-10 h-screen flex flex-col justify-center items-center gap-10">
      <CommandBar variant="clean" />
      <h1></h1>
      {/* <PricingTable /> */}
    </div>
  );
}
