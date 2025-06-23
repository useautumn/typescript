import { AutumnClient } from "./client/ReactAutumnClient";
import { createContext, useContext } from "react";

export interface AutumnDialogContext {
  props: any;
  setProps: (props: any) => void;
  open: boolean;
  setOpen: (open: boolean) => void;
  setComponent: (component: any) => void;
}

export interface AutumnContextParams {
  client: AutumnClient;
  paywallDialog: AutumnDialogContext;
  prodChangeDialog: AutumnDialogContext;
}

export const AutumnContext = createContext<AutumnContextParams>({
  client: new AutumnClient({
    backendUrl: process.env.NEXT_PUBLIC_AUTUMN_BACKEND_URL,
  }),
  
  paywallDialog: {
    props: null,
    setProps: () => {},
    open: false,
    setOpen: () => {},
    setComponent: () => {},
  },

  prodChangeDialog: {
    props: null,
    setProps: () => {},
    open: false,
    setOpen: () => {},
    setComponent: () => {},
  },
});

export const useAutumnContext = () => {
  const context = useContext(AutumnContext);

  if (context === undefined) {
    throw new Error(
      "useAutumnContext must be used within a AutumnContextProvider"
    );
  }

  return context;
};
