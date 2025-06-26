import {
  PricingCard,
  PricingTable as PricecnPricingTable,
} from "@/components/pricing-table";

import { Loader2 } from "lucide-react";
import { useAutumn, usePricingTable } from "autumn-js/react";
import AttachDialog from "@/components/autumn/attach-dialog";

export const PricingTable = () => {
  const { attach } = useAutumn();
  const { products, isLoading, error } = usePricingTable();

  if (isLoading) {
    return (
      <div className="w-full h-full flex justify-center items-center min-h-[300px]">
        <Loader2 className="w-6 h-6 text-zinc-400 animate-spin" />
      </div>
    );
  }

  if (error) {
    return <div> Something went wrong...</div>;
  }

  // console.log("Products: ", products);
  return (
    <div>
      {products && (
        <PricecnPricingTable products={products} className="p-10">
          {products
            .filter((product) => !product.is_add_on)
            .map((product) => (
              <PricingCard
                productId={product.id}
                key={product.id}
                buttonProps={{
                  onClick: async () => {
                    await attach({
                      productId: product.id,
                      dialog: AttachDialog,
                    });
                  },
                }}
              />
            ))}
        </PricecnPricingTable>
      )}
    </div>
  );
};
