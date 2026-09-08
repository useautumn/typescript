import { componentsGeneric } from "convex/server";
import { Autumn, type AutumnComponent } from "./index.js";

const components = componentsGeneric() as unknown as {
  autumn: AutumnComponent;
};

/** Two Autumn organizations that share one installed component instance. */
export const TENANT_A_NAMESPACE = "tenant-a-production";
export const TENANT_B_NAMESPACE = "tenant-b-production";

function tenant(operationNamespace: string) {
  return new Autumn(components.autumn, {
    secretKey: "test-secret-key",
    serverURL: "https://example.test",
    operationNamespace,
    identify: async () => ({ customerId: "customer-1" }),
  });
}

export const { track: trackTenantA } = tenant(TENANT_A_NAMESPACE).internalApi();
export const { track: trackTenantB } = tenant(TENANT_B_NAMESPACE).internalApi();
