import { AutumnContext } from "../AutumnContext";
import { useCustomerBase } from "./useCustomerBase";

export const useCustomer = (params?: { errorOnNotFound?: boolean }) => {
  return useCustomerBase({
    errorOnNotFound: params?.errorOnNotFound,
    AutumnContext: AutumnContext,
  });
};
