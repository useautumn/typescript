import { componentsGeneric } from "convex/server";
import { Autumn, type AutumnComponent } from "./index.js";

const components = componentsGeneric() as unknown as {
  autumn: AutumnComponent;
};

const autumn = new Autumn(components.autumn, {
  secretKey: "test-secret-key",
  serverURL: "https://example.test",
  operationNamespace: "actions-fixture",
  identify: async () => ({ customerId: "customer-1" }),
});

export const {
  check,
  previewAttach,
  previewMultiAttach,
  previewUpdate,
  previewMultiUpdate,
  getCustomer,
  getEntity,
  listEntities,
  getPlan,
  listPlans,
  listEvents,
  aggregateEvents,
} = autumn.api();

export const {
  consumeCheck,
  track,
  attach,
  multiAttach,
  updateSubscription,
  multiUpdate,
  setupPayment,
  getOrCreateCustomer,
  updateCustomer,
  deleteCustomer,
  createEntity,
  updateEntity,
  deleteEntity,
  updateBalance,
  createReferralCode,
  redeemReferralCode,
} = autumn.internalApi();
