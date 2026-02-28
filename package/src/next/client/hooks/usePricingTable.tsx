import {
  type UsePricingTableParams,
  usePricingTableBase,
} from "../../../libraries/react/hooks/usePricingTableBase";
import { AutumnContext, useAutumnContext } from "../../../libraries/react/AutumnContext";

export const usePricingTable = (params?: UsePricingTableParams) => {
  const context = useAutumnContext({
    AutumnContext,
    name: "usePricingTable",
  });

  return usePricingTableBase({ client: context.client, params });
};
