import { useAutumnBase } from "./useAutumnBase";

import { AutumnContext } from "../AutumnContext";

export const useAutumn = () => {
  return useAutumnBase({ AutumnContext });
};
