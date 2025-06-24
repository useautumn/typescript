import { usePricingTableBase } from "./usePricingTableBase";
import { AutumnContext } from "../AutumnContext";
import { ProductDetails } from "../client/types/clientPricingTableTypes";

export const usePricingTable = (params?: {
  productDetails?: ProductDetails[];
}) => {
  return usePricingTableBase({
    AutumnContext,
    params,
  });
};
