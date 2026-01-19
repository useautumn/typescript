import { usePricingTableBase } from "../../../libraries/react/hooks/usePricingTableBase";
import { AutumnContext, useAutumnContext } from "../../../libraries/react/AutumnContext";
import { ProductDetails } from "../../../libraries/react/client/types/clientPricingTableTypes";

export const usePricingTable = (params?: {
  productDetails?: ProductDetails[];
}) => {
  const context = useAutumnContext({
    AutumnContext,
    name: "usePricingTable",
  });

  return usePricingTableBase({ client: context.client, params });
};

