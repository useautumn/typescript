import {
  AutumnContext,
  useAutumnContext,
} from "../../../libraries/react/AutumnContext";
import { useAutumnBase } from "../../../libraries/react/hooks/helpers/useAutumnBase";

export const useAutumn = () => {
  const context = useAutumnContext({
    AutumnContext,
    name: "useAutumn",
  });
  return useAutumnBase({ context, client: context.client });
};
