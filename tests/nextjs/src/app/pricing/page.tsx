"use client";

import { useAutumn } from "autumn-js/next";
import { PricingCard, PricingTable } from "@/components/pricing/pricing-table";
import { usePricingTable } from "autumn-js/next";
import { Button } from "@/components/ui/button";
import ProductChangeDialog from "@/components/autumn/product-change-dialog";
import PaywallDialog from "@/components/autumn/paywall-dialog";

export default function PricingPage() {
  const { attach, check } = useAutumn();
  const { products, isLoading, error, refetch } = usePricingTable();

  return (
    <div className="h-screen w-screen overflow-x-hidden flex flex-col gap-10 items-center justify-center">
      <div className="px-10">
        {products && (
          <PricingTable products={products as any} className="w-full">
            {products.map((product) => {
              return (
                <PricingCard
                  key={product.id}
                  productId={product.id!}
                  onButtonClick={async () => {
                    await attach({
                      productId: product.id!,
                      dialog: ProductChangeDialog,
                    });
                  }}
                />
              );
            })}
          </PricingTable>
        )}
      </div>
      <Button
        onClick={async () => {
          const { data, error } = await check({
            featureId: "action",
            dialog: PaywallDialog,
          });

          console.log(data);
        }}
      >
        Use Action
      </Button>
    </div>
  );
}
