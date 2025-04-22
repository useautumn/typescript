import { Autumn, CustomerData } from "../../sdk";
import { withAuth } from "./auth/withAuth";

export const createAutumnClient = (publishableKey?: string) => {
  return new Autumn({ publishableKey });
};

export const getOrCreateCustomer = withAuth(
  async ({
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

    return result;
  },
  true
);

export const getCustomer = withAuth(
  async ({ customerId }: { customerId: string }) => {
    const autumn = createAutumnClient();
    const result = await autumn.customers.get(customerId);
    return result;
  }
);
