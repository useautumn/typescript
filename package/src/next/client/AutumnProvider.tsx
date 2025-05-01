import { Customer } from "src/sdk";
import { CustomerData } from "src/sdk";
import { AutumnContext } from "./AutumnContext";
import { useEffect, useState } from "react";

export interface AutumnProviderProps {
  children?: React.ReactNode;
  encryptedCustomerId?: string;
  customerData?: CustomerData;
}

const useDialog = (type: string) => {
  const [dialogFound, setDialogFound] = useState<boolean>(false);
  const [dialogProps, setDialogProps] = useState<any>(null);
  const [dialogOpen, setDialogOpen] = useState<boolean>(false);
  const [DialogComponent, setDialogComponent] = useState<any>(null);

  useEffect(() => {
    if (dialogProps) {
      setDialogOpen(true);
    }
  }, [dialogProps]);

  useEffect(() => {
    if (!dialogOpen) {
      setTimeout(() => {
        setDialogProps(null);
      }, 200);
    }
  }, [dialogOpen]);

  const loadDialog = async () => {
    try {
      // @ts-ignore
      let module = await import(`@/components/pricing/${type}-dialog.tsx`);
      if (module.default && typeof module.default === "function") {
        setDialogComponent(() => module.default);
        setDialogFound(true);
      }
    } catch (error) {
      setDialogFound(false);
    }
  };

  useEffect(() => {
    loadDialog();
  }, []);

  return [
    dialogFound,
    dialogProps,
    setDialogProps,
    dialogOpen,
    setDialogOpen,
    DialogComponent,
  ];
};

export const AutumnClientProvider = ({
  children,
  encryptedCustomerId,
  customerData,
}: AutumnProviderProps) => {
  let [customer, setCustomer] = useState<Customer | null>(null);

  const [
    prodChangeDialogFound,
    prodChangeDialogProps,
    setProdChangeDialogProps,
    prodChangeDialogOpen,
    setProdChangeDialogOpen,
    ProdChangeDialogComponent,
  ] = useDialog("product-change");

  const [
    paywallFound,
    paywallProps,
    setPaywallProps,
    paywallOpen,
    setPaywallOpen,
    PaywallDialogComponent,
  ] = useDialog("paywall");

  return (
    <AutumnContext.Provider
      value={{
        encryptedCustomerId,
        customerData,
        customer,
        setCustomer,
        prodChangeDialog: {
          found: prodChangeDialogFound,
          setProps: setProdChangeDialogProps,
          setOpen: setProdChangeDialogOpen,
        },
        paywallDialog: {
          found: paywallFound,
          setProps: setPaywallProps,
          setOpen: setPaywallOpen,
        },
      }}
    >
      {ProdChangeDialogComponent && (
        <ProdChangeDialogComponent
          open={prodChangeDialogOpen}
          setOpen={setProdChangeDialogOpen}
          {...prodChangeDialogProps}
        />
      )}
      {PaywallDialogComponent && (
        <PaywallDialogComponent
          open={paywallOpen}
          setOpen={setPaywallOpen}
          {...paywallProps}
        />
      )}
      {children}
    </AutumnContext.Provider>
  );
};
