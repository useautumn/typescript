"use client";
import { authClient } from "@/lib/auth-client";
import { CheckDialog, useCustomer } from "autumn-js/react";
import { PricingTable } from "autumn-js/react";
import ShadcnPricingTable from "@/components/autumn/pricing-table";
import { Button } from "@/components/ui/button";

export default function Home() {
  const { customer, attach, check, cancel, setupPayment } = useCustomer({
    expand: ["invoices", "referrals", "payment_method"],
  });

  console.log("Customer:", customer);

  const productDetails = [
    {
      id: "free",
      name: "Free",
    },
    {
      id: "pro",
      name: "Pro",
      recommendText: "Lit",
    },
    {
      id: "premium",
      name: "Premium",
      price: 100,
    },
  ];
  return (
    <div className="w-screen h-screen flex justify-center items-start p-10">
      <main className="flex flex-col w-[800px] gap-4 overflow-hidden">
        <div className="flex gap-2">
          <button
            className="bg-blue-500 text-white p-2 rounded-md"
            onClick={async () => {
              const res = await authClient.signIn.email({
                email: "johnyeo10@gmail.com",
                password: "testing123",
              });
              console.log(res);
            }}
          >
            Sign in
          </button>
          <button
            className="bg-blue-500 text-white p-2 rounded-md"
            onClick={async () => {
              const res = await authClient.signUp.email({
                name: "John Yeo",
                email: "johnyeo10@gmail.com",
                password: "testing123",
              });
              console.log(res);
            }}
          >
            Sign up
          </button>
        </div>
        <div className="bg-stone-50 dark:bg-stone-900 max-h-[400px] p-4 overflow-auto text-xs">
          <pre className="whitespace-pre-wrap">
            {JSON.stringify(customer, null, 2)}
          </pre>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={async () => {
              const res = await cancel({
                productId: "pro",
              });
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={async () => {
              const res = await attach({
                productId: "pro",
                successUrl: "https://gmail.com",
              });
              console.log(res);
            }}
          >
            Attach
          </Button>
          <Button
            onClick={async () => {
              const res = await setupPayment({});
              console.log(res);
            }}
          >
            Setup Payment
          </Button>
        </div>

        {/* <div className="w-full p-10"> */}
        <PricingTable />
        <ShadcnPricingTable />
      </main>
    </div>
  );
}

// <div>
//           <button
//             onClick={async () => {
//               const res = await fetch(
//                 "http://localhost:3001/api/auth/autumn/customers",
//                 {
//                   method: "POST",
//                   body: JSON.stringify({
//                     productId: "premium",
//                   }),
//                 }
//               );
//               console.log(res);
//             }}
//           >
//             Test better auth plugin
//           </button>
//         </div>
