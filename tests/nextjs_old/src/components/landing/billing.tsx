"use client";

import { CreditCard } from "lucide-react";
import { toast } from "sonner";
import { Button } from "../ui/button";
import { useAutumn, useCustomer } from "autumn-js/react";

export default function CustomerDetailsExample() {
  const { attach, openBillingPortal } = useAutumn();
  const { customer } = useCustomer();

  const productId = "pro-example";

  const upgradeClicked = async () => {
    try {
      await attach({
        productId,
        successUrl: "https://app.useautumn.com",
      });
    } catch (error: any) {
      toast.error(`${error.message}`);
    }
  };

  const manageBillingClicked = async () => {
    try {
      await openBillingPortal({
        returnUrl: "https://app.useautumn.com",
      });
    } catch (error: any) {
      toast.error(`${error.message}`);
    }
  };

  return (
    <div className="border border-gray-200 rounded-lg bg-white overflow-hidden flex flex-col">
      <div className="border-b border-gray-200 p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold text-gray-900">
              Customer Details
            </h2>
            <p className="text-sm text-gray-500">
              Current subscription and feature access
            </p>
          </div>
          <div className="h-8 w-8 rounded-lg bg-gray-100 flex items-center justify-center">
            <CreditCard className="h-4 w-4 text-gray-500" />
          </div>
        </div>
      </div>

      <div className="p-6 flex-1">
        <div className="space-y-3">
          <div className="flex items-center justify-between py-2 border-b border-gray-200">
            <span className="text-sm font-medium text-gray-900">
              Customer ID
            </span>
            <span className="text-sm font-mono bg-gray-100 px-2 py-1 rounded text-gray-700">
              Customer: {customer?.id}
            </span>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-gray-200">
            <span className="text-sm font-medium text-gray-900">
              Customer Email
            </span>
            <span className="text-sm font-mono bg-gray-100 px-2 py-1 rounded text-gray-700">
              {customer?.email}
            </span>
          </div>

          <div className="flex items-center justify-between py-2 border-b border-gray-200">
            <span className="text-sm font-medium text-gray-900">
              Chat Messages Remaining
            </span>
            {/* <span className="text-sm font-mono bg-gray-100 px-2 py-1 rounded text-gray-700">
              {trafficEvents?.unlimited
                ? "Unlimited"
                : trafficEvents?.balance || 0}
            </span>
            <span className="text-sm font-medium text-gray-900">
              {" "}
              Credits Remaining
            </span>
            <span className="text-sm font-mono bg-gray-100 px-2 py-1 rounded text-gray-700">
              {credits?.unlimited ? "Unlimited" : credits?.balance || 0}
            </span> */}
          </div>

          <div className="flex items-center justify-between py-2">
            <span className="text-sm font-medium text-gray-900">
              Current Plan
            </span>
            <span className="text-sm font-medium">
              <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full">
                {customer?.products[0]?.name || "Free"}
              </span>
            </span>
          </div>
        </div>
      </div>
      <div className="flex gap-2 p-6 pt-0">
        <Button className="flex-1" variant="main" onClick={upgradeClicked}>
          Upgrade to Pro
        </Button>
        <Button
          className="flex-1"
          variant="main"
          onClick={manageBillingClicked}
        >
          Manage Billing
        </Button>
      </div>
    </div>
  );
}
