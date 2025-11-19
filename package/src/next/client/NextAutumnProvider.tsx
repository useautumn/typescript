"use client";

import React from "react";
import { CustomerData } from "../../sdk";
import { NextAutumnClient } from "./NextAutumnClient";
import { AutumnContext } from "../../libraries/react/AutumnContext";
import { BaseAutumnProvider } from "../../libraries/react/BaseAutumnProvider";

export const NextAutumnProvider = ({
  encryptedCustomerId,
  customerData,
  children,
  defaultReturnUrl,
}: {
  encryptedCustomerId?: string;
  customerData?: CustomerData;
  children: React.ReactNode;
  defaultReturnUrl?: string;
}): React.JSX.Element => {
  const client = new NextAutumnClient({
    encryptedCustomerId,
    customerData,
    defaultReturnUrl,
  });

  return (
    <BaseAutumnProvider client={client} AutumnContext={AutumnContext}>
      {children}
    </BaseAutumnProvider>
  );
};
