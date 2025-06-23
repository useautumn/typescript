"use client";

import { CustomerData } from "../../sdk";
import { NextAutumnClient } from "./NextAutumnClient";
import { AutumnContext } from "../../libraries/react/AutumnContext";
import { BaseAutumnProvider } from "../../libraries/react/BaseAutumnProvider";

export const NextAutumnProvider = ({
  encryptedCustomerId,
  customerData,
  children,
}: {
  encryptedCustomerId?: string;
  customerData?: CustomerData;
  children: React.ReactNode;
}) => {
  const client = new NextAutumnClient({
    encryptedCustomerId,
    customerData,
  });

  return (
    <BaseAutumnProvider client={client} AutumnContext={AutumnContext}>
      {children}
    </BaseAutumnProvider>
  );
};
