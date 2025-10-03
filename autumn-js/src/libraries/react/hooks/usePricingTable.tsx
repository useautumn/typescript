  import { usePricingTableBase } from "./usePricingTableBase";
import { AutumnContext, useAutumnContext } from "@/AutumnContext";
import { ProductDetails } from "../client/ProductDetails";


export const usePricingTable = (params?: {
  productDetails?: ProductDetails[];
}) => {
  const context = useAutumnContext({
    AutumnContext,
    name: "usePricingTable",
  });

  return usePricingTableBase({
    client: context.client,
    params,
  });
};
