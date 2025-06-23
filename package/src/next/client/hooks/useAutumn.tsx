import { AutumnContext } from "../../../libraries/react/AutumnContext";
import { useAutumnBase } from "../../../libraries/react/hooks/useAutumnBase";

export const useAutumn = () => {
  return useAutumnBase({ AutumnContext });
};
