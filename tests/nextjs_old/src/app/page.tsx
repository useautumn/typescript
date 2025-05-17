"use client";

import Topbar from "@/components/landing/topbar";
import CustomerDetailsExample from "@/components/landing/billing";
import Intro from "@/components/landing/introduction";
import React from "react";

export default function Home() {
  return (
    <React.Fragment>
      <Topbar />
      <div className="min-h-screen w-full p-6 flex flex-col gap-8 max-w-7xl mx-auto">
        <Intro />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* <Application /> */}
          {/* <CustomerDetailsExample /> */}
        </div>
      </div>
    </React.Fragment>
  );
}
