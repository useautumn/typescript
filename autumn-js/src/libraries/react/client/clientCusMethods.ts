import Autumn from "@sdk";
import { AutumnClient, OmitCustomerType } from "./ReactAutumnClient";


export const createCustomerMethod = async ({
  client,
  params,
}: {
  client: AutumnClient;
  params: Omit<Autumn.CustomerCreateParams, OmitCustomerType>;
}): Promise<Autumn.Customer> => {
  let result = await client.post(`${client.prefix}/customers`, params);
  return result;
};
