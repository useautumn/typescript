import { RouterContext } from "rou3";
import { addRoute } from "rou3";
import {
  Autumn,
  CreateEntityParams,
  GetEntityParams,
} from "../../../sdk";
import { withAuth } from "../utils/withAuth";
import type { RouterOptions } from "./backendRouter";

const createEntityHandler = (options?: RouterOptions) => withAuth({
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
  suppressLogs: options?.suppressLogs,
});

const getEntityHandler = (options?: RouterOptions) => withAuth({
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
  suppressLogs: options?.suppressLogs,
});

const deleteEntityHandler = (options?: RouterOptions) => withAuth({
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
  suppressLogs: options?.suppressLogs,
});

export const addEntityRoutes = async (router: RouterContext, options?: RouterOptions) => {
  addRoute(router, "POST", "/api/autumn/entities", {
    handler: createEntityHandler(options),
  });
  addRoute(router, "GET", "/api/autumn/entities/:entityId", {
    handler: getEntityHandler(options),
  });
  addRoute(router, "DELETE", "/api/autumn/entities/:entityId", {
    handler: deleteEntityHandler(options),
  });
};
