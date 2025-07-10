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

  client: new AutumnClient({ backendUrl: "" }),

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
  errorIfNotInitialized = true,
}: {
  AutumnContext: React.Context<AutumnContextParams>;
  name: string;
  errorIfNotInitialized?: boolean;
}) => {
  const context = useContext(AutumnContext);

  if (!context.initialized && errorIfNotInitialized) {
    throw new Error(`${name} must be used within <AutumnProvider />`);
  }

  return context;
};
