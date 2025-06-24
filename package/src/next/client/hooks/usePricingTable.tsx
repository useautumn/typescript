import { usePricingTableBase } from "../../../libraries/react/hooks/usePricingTableBase";
import { AutumnContext } from "../../../libraries/react/AutumnContext";
import { ProductDetails } from "../../../libraries/react/client/types/clientPricingTableTypes";

export const usePricingTable = (params?: {
  productDetails?: ProductDetails[];
}) => {
  return usePricingTableBase({ AutumnContext, params });
};

