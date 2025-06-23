import { AutumnContext } from "../../../libraries/react/AutumnContext";
import { useCustomerBase, UseCustomerResult } from "../../../libraries/react/hooks/useCustomerBase";

export const useCustomer = (): UseCustomerResult => {
  return useCustomerBase({
    errorOnNotFound: false,
    AutumnContext: AutumnContext,
  });
};
