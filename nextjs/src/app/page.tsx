"use client";
// import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { PaywallDialog, PricingTable, useCustomer } from "autumn-js/react";
import { useEffect, useState } from "react";
// import PricingTable from "@/components/autumn/pricing-table";
import { default as BlockingPaywallDialog } from "@/components/autumn/paywall-dialog";
export default function Home() {
  const {
    attach,
    check,
    track,
    cancel,
    checkout,
    openBillingPortal,
    redeemReferralCode,
    createReferralCode,
    isLoading,
    // allowed,
  } = useCustomer();

  
  // useEffect(() => {
  //   check({ featureId: "create_thinkfasts", dialog: BlockingPaywallDialog });
  // }, [isLoading]);

  // useEffect(() => {
  //   check({ featureId: "create_thinkfasts", dialog: PaywallDialog });
  // }, [isLoading]);

  return (
    <div className="min-h-screen bg-gradient-to-b p-10">
      <main className="max-w-4xl mx-auto space-y-8">
        {/* <PricingTable /> */}
        <section className="space-y-4">
          <div className="flex gap-3">
            <Button
              onClick={async () => {
                const res = await authClient.signIn.email({
                  email: "johnyeo10@gmail.com",
                  password: "testing123",
                });

                console.log(res);
              }}
            >
              Sign In
            </Button>
            <Button
              onClick={async () => {
                const res = await authClient.signOut();
                console.log(res);
              }}
            >
              Sign Out
            </Button>
            <Button
              onClick={async () => {
                const res = await authClient.signUp.email({
                  name: "John Yeo",
                  email: "johnyeo10@gmail.com",
                  password: "testing123",
                });
                console.log(res);
              }}
            >
              Sign Up
            </Button>
            <Button
              onClick={async () => {
                const res = await fetch("http://localhost:3001/api/test", {
                  method: "GET",
                });
                console.log(res);
              }}
            >
              Test Better Auth Plugin
            </Button>
            {/* <Button
              onClick={async () => {
                const res = check({
                  featureId: "credits",
                  dialog: PaywallDialog,
                });
                console.log(res);
              }}
            >
              Test Paywall Dialog
            </Button> */}
          </div>
        </section>

        <PricingTable />

        <div className="flex justify-start items-center gap-2">
          <Button
            onClick={async () => {
              const res = await openBillingPortal({
                // openInNewTab: true,
                returnUrl: "https://facebook.com",
              });
              console.log(res);
            }}
          >
            Open Billing Portal
          </Button>

          <Button
            onClick={async () => {
              const res = await cancel({
                productId: "pro",
              });
              console.log(res);
            }}
          >
            Cancel
          </Button>

          <Button
            onClick={async () => {
              const res = await check({
                featureId: "messages",
              });
              console.log(res);
            }}
          >
            Check
          </Button>

          <Button
            onClick={async () => {
              const res = await track({
                featureId: "messages",
              });
              console.log(res);
            }}
          >
            Track
          </Button>

          <Button
            onClick={async () => {
              const res = await checkout({
                productId: "pro",
                successUrl: "https://facebook.com",
              });
              console.log(res);
            }}
          >
            Checkout
          </Button>
          <Button
            onClick={async () => {
              const res = await attach({
                productId: "pro",
                openInNewTab: true,
              });
              console.log(res);
            }}
          >
            Attach
          </Button>


          <Button
            onClick={async () => {
              const res = await createReferralCode({
                programId: "test",
              });
              console.log(res);
            }}
          >
            Create Referral Code
          </Button>

          <Button
            onClick={async () => {
              const res = await redeemReferralCode({
                code: "test",
              });
              console.log(res);
            }}
          >
            Redeem Referral Code
          </Button>
        </div>
      </main>
    </div>
  );
}
