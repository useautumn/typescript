import { validateCreateCustomer } from "./cusUtils";
import { Autumn } from "../client";
import {
  Customer,
  CreateCustomerParams,
  UpdateCustomerParams,
  BillingPortalParams,
  BillingPortalResponse,
} from "./cusTypes";
import { AutumnError } from "../error";
import { staticWrapper } from "../utils";

export const customerMethods = (instance?: Autumn) => {
  return {
    get: (id: string) => staticWrapper(getCustomer, instance, { id }),
    create: (params?: CreateCustomerParams) =>
      staticWrapper(createCustomer, instance, { params }),
    update: (id: string, params: UpdateCustomerParams) =>
      staticWrapper(updateCustomer, instance, { id, params }),
    delete: (id: string) => staticWrapper(deleteCustomer, instance, { id }),
    billingPortal: (id: string, params?: BillingPortalParams) =>
      staticWrapper(billingPortal, instance, { id, params }),
  };
};

export const getCustomer = async ({
  instance,
  id,
}: {
  instance: Autumn;
  id: string;
}): Promise<{
  data: Customer | null;
  error: AutumnError | null;
}> => {
  if (!id) {
    throw {
      message: "Customer ID is required",
      code: "CUSTOMER_ID_REQUIRED",
    };
  }
  return instance.get(`/customers/${id}`);
};

export const createCustomer = async ({
  instance,
  params,
}: {
  instance: Autumn;
  params?: CreateCustomerParams;
}): Promise<{
  data: Customer | null;
  error: AutumnError | null;
}> => {
  validateCreateCustomer(params || {});
  return instance.post("/customers", params);
};

export const updateCustomer = async ({
  instance,
  id,
  params,
}: {
  instance: Autumn;
  id: string;
  params: UpdateCustomerParams;
}): Promise<{
  data: Customer | null;
  error: AutumnError | null;
}> => {
  return instance.post(`/customers/${id}`, params);
};

export const deleteCustomer = async ({
  instance,
  id,
}: {
  instance: Autumn;
  id: string;
}): Promise<{
  data: Customer | null;
  error: AutumnError | null;
}> => {
  return instance.delete(`/customers/${id}`);
};

export const billingPortal = async ({
  instance,
  id,
  params,
}: {
  instance: Autumn;
  id: string;
  params?: BillingPortalParams;
}): Promise<{
  data: BillingPortalResponse | null;
  error: AutumnError | null;
}> => {
  const queryParams = params?.return_url
    ? `?return_url=${encodeURIComponent(params.return_url)}`
    : "";
  return instance.get(`/customers/${id}/billing_portal${queryParams}`);
};
