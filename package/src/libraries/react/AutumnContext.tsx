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
  entityId?: string | null;
  paywallDialog: AutumnDialogContext;
  attachDialog: AutumnDialogContext;
  paywallRef: React.RefObject<any>;
}

export const AutumnContext = createContext<AutumnContextParams>({
  initialized: false,
  disableDialogs: false,

  client: new AutumnClient({ backendUrl: "" }),

  entityId: undefined,

  paywallDialog: {
    props: null,
    setProps: () => { },
    open: false,
    setOpen: () => { },
    setComponent: () => { },
  },

  attachDialog: {
    props: null,
    setProps: () => { },
    open: false,
    setOpen: () => { },
    setComponent: () => { },
  },

  paywallRef: { current: null },
});

export const useAutumnContext = ({
  AutumnContext,
  name,
  errorIfNotInitialized = true,
  entityId,
}: {
  AutumnContext: React.Context<AutumnContextParams>;
  name: string;
  errorIfNotInitialized?: boolean;
  entityId?: string | null;
}) => {
  const context = useContext(AutumnContext);

  if (!context.initialized && errorIfNotInitialized) {
    throw new Error(`${name} must be used within <AutumnProvider />`);
  }

  return context;
};
