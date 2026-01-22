import { AutumnClient, OmitCustomerType } from "./ReactAutumnClient";
import type { CreateCustomerParams, ExpandedCustomer, CustomerExpandOption } from "../../../sdk";
import type { AutumnPromise } from "../../../sdk/response";

export const createCustomerMethod = async <
  const T extends readonly CustomerExpandOption[] = readonly [],
>({
  client,
  params,
}: {
  client: AutumnClient;
  params: Omit<CreateCustomerParams<T>, OmitCustomerType>;
}): AutumnPromise<ExpandedCustomer<T>> => {
  let result = await client.post(`${client.prefix}/customers`, params);
  return result;
};
