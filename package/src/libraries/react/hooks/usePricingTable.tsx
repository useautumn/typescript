import { usePricingTableBase } from "./usePricingTableBase";
import { ProductDetails } from "../client/types/clientPricingTableTypes";
import { AutumnContext, useAutumnContext } from "@/AutumnContext";

export const usePricingTable = (params?: {
  productDetails?: ProductDetails[];
  entityId?: string;
  customerId?: string;
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
