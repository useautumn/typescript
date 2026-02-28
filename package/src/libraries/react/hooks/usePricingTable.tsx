import {
  type UsePricingTableParams,
  usePricingTableBase,
} from "./usePricingTableBase";
import { AutumnContext, useAutumnContext } from "@/AutumnContext";

export const usePricingTable = (params?: UsePricingTableParams) => {
  const context = useAutumnContext({
    AutumnContext,
    name: "usePricingTable",
  });

  return usePricingTableBase({
    client: context.client,
    params,
  });
};
