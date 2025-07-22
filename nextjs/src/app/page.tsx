"use client";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { useCustomer } from "autumn-js/react";
import { PricingTable } from "autumn-js/react";

export default function Home() {
  const {
    customer,
    attach,
    check,
    track,
    cancel,
    checkout,
    openBillingPortal,
    redeemReferralCode,
    createReferralCode,
    // allowed,
  } = useCustomer();

  // const { data, isLoading, error } = useAnalytics({
  //   featureId: ["chat-messages"],
  // });
  // const checkRes = check({
  //   featureId: "credits",
  //   dialog: CheckDialog,
  // });
  const checkRes = null;

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
            <Button
              onClick={async () => {
                const res = check({
                  featureId: "credits",
                  // dialog: CheckDialog,
                });
                console.log(res);
              }}
            >
              Test Paywall Dialog
            </Button>
          </div>
        </section>
        <section className="space-y-4">
          <h2 className="text-md font-semibold text-slate-800">Check result</h2>
          <pre className="whitespace-pre-wrap text-blue-400 mt-4 text-xs">
            {JSON.stringify(checkRes, null, 4)}
          </pre>
        </section>
        {/* <section className="space-y-4">
          <h2 className="text-md font-semibold text-slate-800">Customer</h2>
          <pre className="whitespace-pre-wrap text-blue-400 mt-4 text-xs">
            {JSON.stringify(customer, null, 4)}
          </pre>
        </section> */}

        <PricingTable />

        {/* <div className="flex justify-start items-center gap-2">
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
              console.log(
                "Allowed:",
                allowed({
                  featureId: "credits",
                })
              );
            }}
          >
            Allowed
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
        </div> */}
      </main>
    </div>
  );
}
