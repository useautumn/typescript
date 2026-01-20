import { AutumnClient, OmitCustomerType } from "./ReactAutumnClient";
import type { AutumnPromise } from "@/utils/response";
import type { Customer } from "@useautumn/sdk/resources/shared";
import type { CustomerCreateParams } from "@useautumn/sdk/resources/customers";

export const createCustomerMethod = async ({
  client,
  params,
}: {
  client: AutumnClient;
  params: Omit<CustomerCreateParams, OmitCustomerType>;
}): AutumnPromise<Customer> => {
  let result = await client.post(`${client.prefix}/customers`, params);
  return result;
};
