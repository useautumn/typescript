import { BaseAutumnProvider } from "./BaseAutumnProvider";
import { AutumnClient } from "./client/ReactAutumnClient";
import { CustomerData } from "../../sdk";
import { AutumnContext } from "./AutumnContext";
import { useEffect } from "react";

export const ReactAutumnProvider = ({
  children,
  getBearerToken,
  backendUrl,
  customerData,
  includeCredentials = true,
  disableDialogs = false,
  authClient,
}: {
  children: React.ReactNode;
  getBearerToken?: () => Promise<string | null | undefined>;
  backendUrl?: string;
  customerData?: CustomerData;
  includeCredentials?: boolean;
  disableDialogs?: boolean;
  authClient?: any;
}) => {
  if (backendUrl && !backendUrl.startsWith("http")) {
    console.warn(`backendUrl is not a valid URL: ${backendUrl}`);
  }

  let client = new AutumnClient({
    backendUrl: backendUrl || "",
    getBearerToken,
    customerData,
    includeCredentials,
  });

  const analyseAuthClient = async () => {
    console.log("Auth client:", authClient);
    // const result = await authClient.autumn.postCustomer();
    // console.log("Result:", result);
  };

  useEffect(() => {
    analyseAuthClient();
  }, [authClient]);

  return (
    <BaseAutumnProvider
      client={client}
      AutumnContext={AutumnContext}
      disableDialogs={disableDialogs}
    >
      {children}
    </BaseAutumnProvider>
  );
};
