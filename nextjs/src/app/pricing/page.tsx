"use client";
import { Autumn } from "autumn-js";
import { PricingCard, PricingTable } from "@/components/pricing/pricing-table";
import { usePricingTable } from "autumn-js/next";
import { useAutumn } from "autumn-js/next";
import { PricingTableExample } from "@/components/pricing/example";

// Get products

export default function PricingPage() {
  const { attach } = useAutumn();

  const { products, isLoading, error, refetch } = usePricingTable({
    productDetails: [
      {
        id: "free",
        description: "Try it out now",
      },
      {
        id: "pro",
        description: "Testing",
      },
      {
        id: "add-on-words",
        description: "Testing",
      },
      {
        id: "creds-test",
        description: "Testing",
      },
      {
        id: "team",
        description: "Try it out now",
      },
    ],
  });

  // return <PricingTableExample />;

  return (
    <div className="h-screen w-screen overflow-x-hidden flex items-center justify-center">
      <div className="px-10">
        <PricingTable products={products as any} className="w-full">
          {products.map((product) => {
            return (
              <PricingCard
                key={product.id}
                productId={product.id!}
                onButtonClick={async () => {
                  await attach({
                    productId: product.id!,
                    callback: refetch,
                  });
                }}
              />
            );
          })}
        </PricingTable>
      </div>
    </div>
  );
}
