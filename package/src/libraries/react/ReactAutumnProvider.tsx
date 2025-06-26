import { BaseAutumnProvider } from "./BaseAutumnProvider";
import { AutumnClient } from "./client/ReactAutumnClient";
import { CustomerData } from "../../sdk";
import { AutumnContext } from "./AutumnContext";


export const ReactAutumnProvider = ({
  children,
  getBearerToken,
  backendUrl,
  customerData,
  includeCredentials = true,
  disableDialogs = false,
}: {
  children: React.ReactNode;
  getBearerToken?: () => Promise<string | null | undefined>;
  backendUrl?: string;
  customerData?: CustomerData;
  includeCredentials?: boolean;
  disableDialogs?: boolean;
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
