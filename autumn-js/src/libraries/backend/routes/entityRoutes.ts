import { RouterContext } from "rou3";
import { addRoute } from "rou3";
import {
  Autumn,
  // CreateEntityParams,
  // CustomerData,
  // GetEntityParams,
} from "@sdk";
import { withAuth } from "../utils/withAuth";

const createEntityHandler = withAuth({
  fn: async ({
    autumn,
    customer_id,
    body,
  }: {
    autumn: Autumn;
    customer_id: string;
    body: Autumn.EntityCreateParams;
  }) => {
    return await autumn.entities.create(customer_id, body);
  },
});

const getEntityHandler = withAuth({
  fn: async ({
    autumn,
    customer_id,
    pathParams,
    searchParams,
  }: {
    autumn: Autumn;
    customer_id: string;
    pathParams?: Record<string, string>;
    searchParams?: Record<string, string>;
  }) => {
    if (!pathParams?.entityId) {
      return {
        statusCode: 400,
        body: {
          error: "no_entity_id",
          message: "Entity ID is required",
        },
      };
    }

    return await autumn.entities.get(pathParams.entityId, {
      customer_id: customer_id,
      expand: searchParams?.expand ? searchParams?.expand.split(",") as "invoices"[] : undefined,
    });
  },
});

const deleteEntityHandler = withAuth({
  fn: async ({
    autumn,
    customer_id,
    pathParams,
  }: {
    autumn: Autumn;
    customer_id: string;
    pathParams?: Record<string, string>;
  }) => {
    if (!pathParams?.entityId) {
      return {
        statusCode: 400,
        body: {
          error: "no_entity_id",
          message: "Entity ID is required",
        },
      };
    }

    return await autumn.entities.delete(pathParams.entityId, {
      customer_id: customer_id,
    });
  },
});

export const addEntityRoutes = async (router: RouterContext) => {
  addRoute(router, "POST", "/api/autumn/entities", {
    handler: createEntityHandler,
  });
  addRoute(router, "GET", "/api/autumn/entities/:entityId", {
    handler: getEntityHandler,
  });
  addRoute(router, "DELETE", "/api/autumn/entities/:entityId", {
    handler: deleteEntityHandler,
  });
};
