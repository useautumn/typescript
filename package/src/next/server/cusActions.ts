import { Autumn, CustomerData } from "../../sdk";
import { withAuth } from "./auth/withAuth";
import { toServerResponse } from "./utils";

export const createAutumnClient = (publishableKey?: string) => {
  return new Autumn({
    publishableKey,
  });
};

export const getOrCreateCustomer = withAuth({
  fn: async ({
    customerId,
    customerData,
  }: {
    customerId: string;
    customerData?: CustomerData;
  }) => {
    const autumn = createAutumnClient();

    const result = await autumn.customers.create({
      id: customerId,
      ...customerData,
    });

    return toServerResponse(result);
  },
  withCustomerData: true,
});

export const getCustomer = withAuth({
  fn: async ({ customerId }: { customerId: string }) => {
    const autumn = createAutumnClient();
    const result = await autumn.customers.get(customerId);
    return toServerResponse(result);
  },
});
