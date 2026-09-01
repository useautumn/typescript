import { componentsGeneric } from "convex/server";
import { Autumn, type AutumnComponent } from "./index.js";

const components = componentsGeneric() as unknown as {
  autumn: AutumnComponent;
};

const autumn = new Autumn(components.autumn, {
  secretKey: "test-secret-key",
  serverURL: "https://example.test",
  identify: async () => ({ customerId: "customer-1" }),
});

export const {
  check,
  track,
  previewAttach,
  attach,
  previewMultiAttach,
  multiAttach,
  previewUpdate,
  updateSubscription,
  previewMultiUpdate,
  multiUpdate,
  setupPayment,
  billingPortal,
  getCustomer,
  getOrCreateCustomer,
  updateCustomer,
  deleteCustomer,
  createEntity,
  getEntity,
  listEntities,
  updateEntity,
  deleteEntity,
  getPlan,
  listPlans,
  updateBalance,
  listEvents,
  aggregateEvents,
  createReferralCode,
  redeemReferralCode,
} = autumn.api();
