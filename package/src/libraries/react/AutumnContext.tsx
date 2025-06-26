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
  initialized: boolean;
  disableDialogs: boolean;

  client: AutumnClient;

  // Internal
  paywallDialog: AutumnDialogContext;
  attachDialog: AutumnDialogContext;
}

export const AutumnContext = createContext<AutumnContextParams>({
  initialized: false,
  disableDialogs: false,
  
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

  attachDialog: {
    props: null,
    setProps: () => {},
    open: false,
    setOpen: () => {},
    setComponent: () => {},
  },
});

export const useAutumnContext = ({
  AutumnContext,
  name,
}: {
  AutumnContext: React.Context<AutumnContextParams>;
  name: string;
}) => {
  const context = useContext(AutumnContext);


  if (!context.initialized) {
    // console.error(`${name} must be used within <AutumnProvider />`);
    throw new Error(`${name} must be used within <AutumnProvider />`);
  }

  return context;
};
