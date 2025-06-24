import { AutumnContext } from "../../../libraries/react/AutumnContext";
import { useCustomerBase, UseCustomerParams, UseCustomerResult } from "../../../libraries/react/hooks/useCustomerBase";

export const useCustomer = (params?: UseCustomerParams): UseCustomerResult => {
  return useCustomerBase({
    params,
    AutumnContext: AutumnContext,
  });
};
