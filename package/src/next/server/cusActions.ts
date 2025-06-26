
import { Autumn, CreateCustomerParams, CustomerData } from "../../sdk";
import { withAuth } from "./auth/withNextAuth";
import { toServerResponse } from "./utils";
import { CreateEntityParams, GetEntityParams } from "../../libraries/react/client/types/clientEntTypes";
import { toSnakeCase } from "../../utils/toSnakeCase";

export const createAutumnClient = (publishableKey?: string) => {
  return new Autumn({
    publishableKey,
  });
};

export const createCusAction = withAuth({
  fn: async ({
    customerId,
    customerData,
    ...params
  }: {
    customerId: string;
    customerData?: CustomerData;
    params?: CreateCustomerParams;
  }) => {
    const autumn = createAutumnClient();

    const result = await autumn.customers.create({
      id: customerId,
      ...customerData,
      ...params,
    });

    return toServerResponse(result);
  },
  withCustomerData: true,
});

export const getEntityAction = withAuth({
  fn: async ({
    customerId,
    entityId,
    ...params
  }: {
    customerId: string;
    entityId: string;
    params?: GetEntityParams;
  }) => {
    const autumn = createAutumnClient();

    let snakeParams = toSnakeCase(params);
    const result = await autumn.entities.get(
      customerId,
      entityId,
      snakeParams as any
    );

    return toServerResponse(result);
  },
});

export const createEntityAction = withAuth({
  fn: async ({
    customerId,
    entity,
  }: {
    customerId: string;
    entity: CreateEntityParams | CreateEntityParams[];
  }) => {
    const autumn = createAutumnClient();
    let snakeEntity = toSnakeCase(entity);
    const result = await autumn.entities.create(customerId, snakeEntity);
    return toServerResponse(result);
  },
});

export const deleteEntityAction = withAuth({
  fn: async ({
    customerId,
    entityId,
  }: {
    customerId: string;
    entityId: string;
  }) => {
    const autumn = createAutumnClient();
    const result = await autumn.entities.delete(customerId, entityId);
    return toServerResponse(result);
  },
});
