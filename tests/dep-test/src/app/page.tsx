"use client";
import { PricingCard, PricingTable } from "@/components/pricing/pricing-table";
import { Button } from "@/components/ui/button";
import { useAutumn, useCustomer, usePricingTable } from "autumn-js/next";

export default function Home() {
  const { customer, isLoading, error } = useCustomer();
  const { check, attach } = useAutumn();
  const { products } = usePricingTable();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (error) {
    console.error("(Autumn) Error:", error);
    return <div>Error: {error.message}</div>;
  }

  return (
    <div className="p-10">
      <h1>
        Customer {customer.email} ({customer.id})
      </h1>
      {products && products.length > 0 && (
        <PricingTable products={products}>
          {products.map((product) => {
            return (
              <PricingCard
                key={product.id}
                productId={product.id}
                buttonProps={{
                  onClick: async () => {
                    await attach({
                      productId: product.id,
                    });
                  },
                }}
              />
            );
          })}
        </PricingTable>
      )}
      <Button
        onClick={async () => {
          const result = await check({
            featureId: "chat-messages",
          });
          console.log("Result", result);
        }}
      >
        Open Dialog
      </Button>
    </div>
  );
}
