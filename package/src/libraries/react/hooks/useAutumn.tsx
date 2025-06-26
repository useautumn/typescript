import { useAutumnBase } from "./useAutumnBase";
import { AutumnContext } from "../AutumnContext";

/**
 * @deprecated The functions exported from this hook can now be found in useCustomer
 */
export const useAutumn = () => {
  return useAutumnBase({ AutumnContext });
};
