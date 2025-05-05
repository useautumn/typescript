import { Customer, fetchPricingTable, PricingTableProduct } from "src/sdk";
import { CustomerData } from "src/sdk";
import { AutumnContext } from "./AutumnContext";
import { useEffect, useState } from "react";
import { usePricingTable } from "./hooks/usePricingTable";

export interface AutumnProviderProps {
  children?: React.ReactNode;
  encryptedCustomerId?: string;
  customerData?: CustomerData;
  components?: {
    paywallDialog?: any;
    productChangeDialog?: any;
  };
}

const useDialog = (component?: any) => {
  const [dialogFound, setDialogFound] = useState<boolean>(false);
  const [dialogProps, setDialogProps] = useState<any>(null);
  const [dialogOpen, setDialogOpen] = useState<boolean>(false);

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
    if (component) {
      setDialogFound(true);
    } else {
      setDialogFound(false);
    }
  };

  useEffect(() => {
    loadDialog();
  }, []);

  return [dialogFound, dialogProps, setDialogProps, dialogOpen, setDialogOpen];
};

export const AutumnClientProvider = ({
  children,
  encryptedCustomerId,
  customerData,
  components,
}: AutumnProviderProps) => {
  let [customer, setCustomer] = useState<Customer | null>(null);
  let [pricingTableProducts, setPricingTableProducts] = useState<
    PricingTableProduct[] | null
  >(null);

  const [
    prodChangeDialogFound,
    prodChangeDialogProps,
    setProdChangeDialogProps,
    prodChangeDialogOpen,
    setProdChangeDialogOpen,
  ] = useDialog(components?.productChangeDialog);

  const [
    paywallFound,
    paywallProps,
    setPaywallProps,
    paywallOpen,
    setPaywallOpen,
  ] = useDialog(components?.paywallDialog);

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
        pricingTableProducts,
        setPricingTableProducts,
      }}
    >
      {components?.productChangeDialog && (
        <components.productChangeDialog
          open={prodChangeDialogOpen}
          setOpen={setProdChangeDialogOpen}
          {...prodChangeDialogProps}
        />
      )}
      {components?.paywallDialog && (
        <components.paywallDialog
          open={paywallOpen}
          setOpen={setPaywallOpen}
          {...paywallProps}
        />
      )}
      {children}
    </AutumnContext.Provider>
  );
};
