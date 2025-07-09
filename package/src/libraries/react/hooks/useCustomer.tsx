import { useEffect } from "react";
import { AutumnContext } from "../AutumnContext";
import { useCustomerBase, UseCustomerParams } from "./useCustomerBase";

export const useCustomer = (params?: UseCustomerParams) => {
  return useCustomerBase({
    params,
    AutumnContext: AutumnContext,
  });
};
