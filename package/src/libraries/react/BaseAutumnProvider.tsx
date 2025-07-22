"use client";

import React, { useRef } from "react";
import { useState, useEffect } from "react";
import { AutumnClient } from "./client/ReactAutumnClient";
import { useDialog } from "./hooks/helpers/useDialog";
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

  useCustomerBase({ client, params: { errorOnNotFound: false } });

  const paywallRef = useRef<any>(null);

  const [refresh, setRefresh] = useState(0);

  return (
    <AutumnContext.Provider
      value={{
        initialized: true,
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

        attachDialog: {
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
        paywallRef,
        refresh,
        setRefresh,
      }}
    >
      {paywallRef.current && (
        <paywallRef.current.component
          open={paywallRef.current.open}
          setOpen={paywallRef.current.setOpen}
          {...paywallRef.current.props}
        />
      )}
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
