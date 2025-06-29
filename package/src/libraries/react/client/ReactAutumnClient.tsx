import {
  AutumnError,
  CreateCustomerParams,
  CustomerData,
  toContainerResult,
} from "../../../sdk";
import { logFetchError } from "../errorUtils/logFetchError";
import { getPricingTableMethod } from "./clientCompMethods";
import { createCustomerMethod } from "./clientCusMethods";
import {
  createEntityMethod,
  deleteEntityMethod,
  getEntityMethod,
} from "./clientEntityMethods";

import {
  attachMethod,
  cancelMethod,
  checkMethod,
  openBillingPortalMethod,
  trackMethod,
} from "./clientGenMethods";
import { listProductsMethod } from "./clientProdMethods";
import { redeemCode, createCode } from "./clientReferralMethods";

export interface ErrorResponse {
  message: string;
  code: string;
}

export type OmitCustomerType =
  | "id"
  | "name"
  | "email"
  | "fingerprint"
  | "customer_id";

export interface AutumnClientConfig {
  backendUrl?: string;
  getBearerToken?: () => Promise<string | null | undefined>;
  customerData?: CustomerData;
  includeCredentials?: boolean;
}

export class AutumnClient {
  protected readonly backendUrl?: string;
  protected readonly getBearerToken?: () => Promise<string | null | undefined>;
  protected readonly customerData?: CustomerData;
  protected readonly includeCredentials?: boolean;
  // protected readonly pathPrefix?: string;

  constructor({
    backendUrl,
    getBearerToken,
    customerData,
    includeCredentials,
  }: AutumnClientConfig) {
    // How to detect if better auth is used...
    this.backendUrl = backendUrl;
    // this.pathPrefix = "/api/autumn";
    this.getBearerToken = getBearerToken;
    this.customerData = customerData;
    this.includeCredentials = includeCredentials;
  }

  async getHeaders() {
    let headers: any = {
      "Content-Type": "application/json",
    };

    if (this.getBearerToken) {
      try {
        let token = await this.getBearerToken();
        headers.Authorization = `Bearer ${token}`;
      } catch (error) {
        console.error(`Failed to call getToken() in AutumnProvider`);
      }
    }

    return headers;
  }

  async handleFetch({
    path,
    method,
    body,
  }: {
    path: string;
    method: string;
    body?: any;
  }) {
    body =
      method === "POST"
        ? JSON.stringify({
            ...body,
            customer_data: this.customerData || undefined,
          })
        : undefined;

    try {
      const response = await fetch(`${this.backendUrl}${path}`, {
        method,
        body,
        headers: await this.getHeaders(),
        credentials: this.includeCredentials ? "include" : undefined,
      });

      return await toContainerResult({ response, logger: console });
    } catch (error: any) {
      logFetchError({
        method,
        backendUrl: this.backendUrl || "",
        path,
        error,
      });
      return {
        data: null,
        error: new AutumnError({
          message: error.message,
          code: "fetch_failed",
        }),
      };
    }
  }

  async post(path: string, body: any) {
    return await this.handleFetch({
      path,
      method: "POST",
      body,
    });
  }

  async get(path: string) {
    return await this.handleFetch({
      path,
      method: "GET",
    });
  }

  async delete(path: string) {
    return await this.handleFetch({
      path,
      method: "DELETE",
    });
  }

  async createCustomer(
    params: Omit<CreateCustomerParams, "id" | "data"> & {
      errorOnNotFound?: boolean;
    }
  ) {
    return await createCustomerMethod({
      client: this,
      params,
    });
  }

  async getPricingTable() {
    return await getPricingTableMethod.bind(this)();
  }

  attach = attachMethod.bind(this);
  cancel = cancelMethod.bind(this);
  check = checkMethod.bind(this);
  track = trackMethod.bind(this);
  openBillingPortal = openBillingPortalMethod.bind(this);

  entities = {
    create: createEntityMethod.bind(this),
    get: getEntityMethod.bind(this),
    delete: deleteEntityMethod.bind(this),
  };

  referrals = {
    createCode: createCode.bind(this),
    redeemCode: redeemCode.bind(this),
  };

  products = {
    list: listProductsMethod.bind(this),
  };
}
