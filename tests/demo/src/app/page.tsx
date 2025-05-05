"use client";

import { CommandBar } from "@/components/command";
import { PricingTable } from "@/components/autumn/pricing-table";

export default function Home() {
  return (
    <div className="p-10 h-screen flex flex-col justify-center items-center gap-10">
      <CommandBar variant="clean" />
      <PricingTable />
    </div>
  );
}
