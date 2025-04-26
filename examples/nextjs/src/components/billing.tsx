"use client";

import { CreditCard } from "lucide-react";
import { toast } from "sonner";
import { useAutumn } from "autumn-js/next";
import { Button } from "./ui/button";
export default function CustomerDetailsExample() {
  const { customer, attach, openBillingPortal } = useAutumn();
  const productId = "pro-example";

  const getEntitlement = (featureId: string) => {
    return customer?.features.find(
      (entitlement: any) => entitlement.feature_id === featureId
    );
  };

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

  const messageCredits = getEntitlement("chat-messages");

  const hasPro =
    customer?.products?.length && customer?.products[0].id === productId;

  return (
    <div className="border border-gray-800 rounded-lg bg-zinc-900 overflow-hidden flex flex-col">
      <div className="border-b border-gray-800 p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold text-white">
              Customer Details
            </h2>
            <p className="text-sm text-gray-400">
              Current subscription and feature access
            </p>
          </div>
          <div className="h-8 w-8 rounded-lg bg-gray-800 flex items-center justify-center">
            <CreditCard className="h-4 w-4 text-gray-400" />
          </div>
        </div>
      </div>

      <div className="p-6 flex-1">
        <div className="space-y-3">
          <div className="flex items-center justify-between py-2 border-b border-gray-800">
            <span className="text-sm font-medium text-white">Customer ID</span>
            <span className="text-sm font-mono bg-gray-800 px-2 py-1 rounded text-gray-300">
              {customer?.id}
            </span>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-gray-800">
            <span className="text-sm font-medium text-white">
              Customer Email
            </span>
            <span className="text-sm font-mono bg-gray-800 px-2 py-1 rounded text-gray-300">
              {customer?.email}
            </span>
          </div>

          <div className="flex items-center justify-between py-2 border-b border-gray-800">
            <span className="text-sm font-medium text-white">
              Chat Messages Remaining
            </span>
            <span className="text-sm font-mono bg-gray-800 px-2 py-1 rounded text-gray-300">
              {messageCredits?.unlimited
                ? "Unlimited"
                : messageCredits?.balance || 0}
            </span>
          </div>

          <div className="flex items-center justify-between py-2">
            <span className="text-sm font-medium text-white">Current Plan</span>
            <span className="text-sm font-medium">
              {hasPro ? (
                <span className="bg-purple-900 text-purple-200 px-2 py-1 rounded-full">
                  Pro
                </span>
              ) : (
                <span className="bg-gray-800 text-gray-300 px-2 py-1 rounded-full">
                  Free
                </span>
              )}
            </span>
          </div>
        </div>
      </div>
      <div className="flex gap-2 p-6 pt-0">
        {!hasPro && (
          <Button
            className=" flex-1 w-full border-1 rounded-md border-[#0E8454] hover:border-[#48C890] bg-[#006239] hover:bg-[#2C7B57] text-white transition-colors"
            onClick={upgradeClicked}
          >
            Upgrade to Pro
          </Button>
        )}
        <Button
          className=" flex-1 w-full border-1 rounded-md border-[#0E8454] hover:border-[#48C890] bg-[#006239] hover:bg-[#2C7B57] text-white transition-colors"
          onClick={manageBillingClicked}
        >
          Manage Billing
        </Button>
      </div>
    </div>
  );
}
