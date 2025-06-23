"use client";

import React from "react";
import { useState } from "react";
import { AutumnClient } from "./client/ReactAutumnClient";
import { useDialog } from "./hooks/useDialog";
import { useCustomerBase } from "./hooks/useCustomerBase";



export function BaseAutumnProvider({
  client,
  children,
  AutumnContext,
}: {
  client: AutumnClient;
  children: React.ReactNode;
  AutumnContext: any;
}) {
  const [components, setComponents] = useState<{
    paywallDialog?: any;
    productChangeDialog?: any;
  }>({});

  const [paywallProps, setPaywallProps, paywallOpen, setPaywallOpen] =
    useDialog(components.paywallDialog);

  const [
    productChangeProps,
    setProductChangeProps,
    productChangeOpen,
    setProductChangeOpen,
  ] = useDialog(components.productChangeDialog);

  useCustomerBase({ client, AutumnContext, errorOnNotFound: false });


  return (
    <AutumnContext.Provider
      value={{
        client,

        paywallDialog: {
          props: paywallProps,
          setProps: setPaywallProps,
          open: paywallOpen,
          setOpen: setPaywallOpen,
          setComponent: (component: any) => {
            setComponents({
              ...components,
              paywallDialog: component,
            });
          },
        },

        prodChangeDialog: {
          props: productChangeProps,
          setProps: setProductChangeProps,
          open: productChangeOpen,
          setOpen: setProductChangeOpen,
          setComponent: (component: any) => {
            setComponents({
              ...components,
              productChangeDialog: component,
            });
          },
        },
      }}
    >
      {components.paywallDialog && (
        <components.paywallDialog
          open={paywallOpen}
          setOpen={setPaywallOpen}
          {...paywallProps}
        />
      )}
      {components.productChangeDialog && (
        <components.productChangeDialog
          open={productChangeOpen}
          setOpen={setProductChangeOpen}
          {...productChangeProps}
        />
      )}
      {children}
    </AutumnContext.Provider>
  );
}
