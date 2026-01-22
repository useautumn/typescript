import { Autumn } from "../client";
import type {
  Customer,
  CreateCustomerParams,
  UpdateCustomerParams,
  BillingPortalParams,
  BillingPortalResult,
  GetCustomerParams,
  UpdateBalancesParams,
  UpdateBalancesResult,
  DeleteCustomerParams,
  ListCustomersParams,
  ExpandedCustomer,
} from "./cusTypes";
import type { CustomerExpandOption } from "./cusEnums";
import { staticWrapper, buildPathWithQuery } from "../utils";
import { AutumnPromise } from "../response";
import { AutumnError } from "../error";

export const customerMethods = (instance?: Autumn) => {
  return {
    list: (params?: ListCustomersParams) => staticWrapper(listCustomers, instance, { params }),
    get: <const T extends readonly CustomerExpandOption[] = readonly []>(
      id: string,
      params?: GetCustomerParams<T>,
    ) =>
      staticWrapper(getCustomer<T>, instance, { id, params }) as AutumnPromise<
        ExpandedCustomer<T>
      >,
    create: <const T extends readonly CustomerExpandOption[] = readonly []>(
      params?: CreateCustomerParams<T>,
    ) =>
      staticWrapper(createCustomer<T>, instance, { params }) as AutumnPromise<
        ExpandedCustomer<T>
      >,
    update: (id: string, params: UpdateCustomerParams) =>
      staticWrapper(updateCustomer, instance, { id, params }),

    delete: (id: string, params?: DeleteCustomerParams) => staticWrapper(deleteCustomer, instance, { id, params }),

    billingPortal: (id: string, params?: BillingPortalParams) =>
      staticWrapper(billingPortal, instance, { id, params }),

    updateBalances: (id: string, params: UpdateBalancesParams) =>
      staticWrapper(updateBalances, instance, { id, params }),
  };
};


export const getExpandStr = (expand?: string[]) => {
  if (!expand) {
    return "";
  }
  return `expand=${expand.join(",")}`;
};

export const listCustomers = async ({
  instance,
  params,
}: {
  instance: Autumn;
  params?: ListCustomersParams;
}): AutumnPromise<{
  list: Customer[];
  total: number;
  limit: number;
  offset: number; 
}> => {
  const path = buildPathWithQuery("/customers", params);
  return instance.get(path);
};

export const getCustomer = async <
  const T extends readonly CustomerExpandOption[] = readonly [],
>({
  instance,
  id,
  params,
}: {
  instance: Autumn;
  id: string;
  params?: GetCustomerParams<T>;
}): AutumnPromise<ExpandedCustomer<T>> => {
  if (!id) {
    return {
      data: null,
      error: new AutumnError({
        message: "Customer ID is required",
        code: "CUSTOMER_ID_REQUIRED",
      }),
    };
  }

  return instance.get(`/customers/${id}?${getExpandStr(params?.expand as string[] | undefined)}`);
};

export const createCustomer = async <
  const T extends readonly CustomerExpandOption[] = readonly [],
>({
  instance,
  params,
}: {
  instance: Autumn;
  params?: CreateCustomerParams<T>;
}): AutumnPromise<ExpandedCustomer<T>> => {
  return instance.post(`/customers?${getExpandStr(params?.expand as string[] | undefined)}`, params);
};

export const updateCustomer = async ({
  instance,
  id,
  params,
}: {
  instance: Autumn;
  id: string;
  params: UpdateCustomerParams;
}): AutumnPromise<Customer> => {
  return instance.post(`/customers/${id}`, params);
};

export const deleteCustomer = async ({
  instance,
  id,
  params,
}: {
  instance: Autumn;
  id: string;
  params?: DeleteCustomerParams;
}): AutumnPromise<Customer> => {
  return instance.delete(`/customers/${id}${params?.delete_in_stripe ? "?delete_in_stripe=true" : ""}`);
};

export const billingPortal = async ({
  instance,
  id,
  params,
}: {
  instance: Autumn;
  id: string;
  params?: BillingPortalParams;
}): AutumnPromise<BillingPortalResult> => {
  const finalParams = {
    ...params,
    return_url: params?.return_url ?? instance.defaultReturnUrl,
  };
  return instance.post(`/customers/${id}/billing_portal`, finalParams);
};

export const updateBalances = async ({
  instance,
  id,
  params,
}: {
  instance: Autumn;
  id: string;
  params: UpdateBalancesParams;
}): AutumnPromise<UpdateBalancesResult> => {
  return instance.post(`/customers/${id}/balances`, {
    balances: Array.isArray(params) ? params : [params],
  });
};
