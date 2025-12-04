import {
  AutumnError,
  AutumnPromise,
  CreateCustomerParams,
  CustomerData,
  Product,
  toContainerResult,
} from "../../sdk";

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

export interface SvelteAutumnClientConfig {
  backendUrl?: string;
  getBearerToken?: () => Promise<string | null | undefined>;
  customerData?: CustomerData;
  includeCredentials?: boolean;
  betterAuthUrl?: string;
  headers?: Record<string, string>;
  pathPrefix?: string;
  defaultReturnUrl?: string;
}

/**
 * Autumn client for Svelte applications.
 * Handles all API communication with the Autumn backend.
 */
export class SvelteAutumnClient {
  public readonly backendUrl?: string;
  protected readonly getBearerToken?: () => Promise<string | null | undefined>;
  public readonly customerData?: CustomerData;
  protected includeCredentials?: boolean;
  public readonly prefix: string;
  public readonly camelCase: boolean;
  public readonly headers?: Record<string, string>;
  public readonly defaultReturnUrl?: string;

  constructor({
    backendUrl,
    getBearerToken,
    customerData,
    includeCredentials,
    betterAuthUrl,
    headers,
    pathPrefix,
    defaultReturnUrl,
  }: SvelteAutumnClientConfig) {
    this.backendUrl = backendUrl;
    this.getBearerToken = getBearerToken;
    this.customerData = customerData;
    this.includeCredentials = includeCredentials;
    this.prefix = "/api/autumn";
    let camelCase = false;

    if (betterAuthUrl) {
      this.prefix = "/api/auth/autumn";
      this.backendUrl = betterAuthUrl;
      camelCase = true;
    }

    if (pathPrefix) {
      const normalized = `/${pathPrefix}`
        .replace(/\/+/g, "/")
        .replace(/\/$/, "");
      this.prefix = normalized;
    }

    this.headers = headers;
    this.camelCase = camelCase;
    this.defaultReturnUrl = defaultReturnUrl;
  }

  /**
   * Detects if the backend supports CORS credentials
   */
  public async detectCors() {
    if (this.prefix?.includes("/api/auth")) {
      return { valid: true, includeCredentials: true };
    }

    const testEndpoint = `${this.backendUrl}${this.prefix}/cors`;

    try {
      await fetch(testEndpoint, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      return { valid: true, includeCredentials: true };
    } catch (_) {
      try {
        await fetch(testEndpoint, {
          method: "POST",
          credentials: "omit",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        });
        return { valid: true, includeCredentials: false };
      } catch (_) {
        return { valid: false, includeCredentials: undefined };
      }
    }
  }

  /**
   * Determines whether to include credentials based on CORS detection
   */
  public async shouldIncludeCredentials(): Promise<boolean> {
    if (this.includeCredentials !== undefined) {
      return this.includeCredentials;
    }

    try {
      const corsResult = await this.detectCors();
      if (corsResult.valid) {
        console.warn(
          `[Autumn] Detected CORS credentials: ${corsResult.includeCredentials}`
        );
        console.warn(
          `[Autumn] To disable this warning, set includeCredentials={${
            corsResult.includeCredentials ? "true" : "false"
          }} in AutumnProvider`
        );
        this.includeCredentials = corsResult.includeCredentials;
        return corsResult.includeCredentials || false;
      }

      console.warn(`[Autumn] CORS detection failed, defaulting to false`);
      return false;
    } catch (error: any) {
      console.error(`[Autumn] Error detecting CORS: ${error.message}`);
      return false;
    }
  }

  async getHeaders() {
    let headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (this.getBearerToken) {
      try {
        const token = await this.getBearerToken();
        if (token) {
          headers.Authorization = `Bearer ${token}`;
        }
      } catch (_) {
        console.error(`Failed to call getBearerToken() in AutumnProvider`);
      }
    }

    if (this.headers) {
      headers = { ...headers, ...this.headers };
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
    body?: Record<string, unknown> | Record<string, unknown>[];
  }) {
    body =
      method === "POST"
        ? {
            ...body,
            [this.camelCase ? "customerData" : "customer_data"]:
              this.customerData || undefined,
          }
        : undefined;

    const includeCredentials = await this.shouldIncludeCredentials();

    try {
      const response = await fetch(`${this.backendUrl}${path}`, {
        method,
        body: body ? JSON.stringify(body) : undefined,
        headers: await this.getHeaders(),
        credentials: includeCredentials ? "include" : "omit",
      });

      return await toContainerResult({
        response,
        logger: console,
        logError: true,
      });
    } catch (error: unknown) {
      console.error(`[Autumn] Fetch error:`, {
        method,
        backendUrl: this.backendUrl || "",
        path,
        error,
      });
      return {
        data: null,
        error: new AutumnError({
          message:
            error instanceof Error ? error.message : JSON.stringify(error),
          code: "fetch_failed",
        }),
      };
    }
  }

  async post(
    path: string,
    body: Record<string, unknown> | Record<string, unknown>[]
  ) {
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

  // Customer methods
  async createCustomer(
    params: Omit<CreateCustomerParams, "id" | "data"> & {
      errorOnNotFound?: boolean;
    }
  ) {
    return await this.post(`${this.prefix}/customers`, params);
  }

  // Attach / Checkout methods
  async attach(params: {
    productId: string;
    successUrl?: string;
    cancelUrl?: string;
    options?: Record<string, unknown>;
  }) {
    const finalParams = {
      ...params,
      successUrl: params.successUrl ?? this.defaultReturnUrl,
    };
    return await this.post(`${this.prefix}/attach`, finalParams);
  }

  async checkout(params: {
    productId: string;
    successUrl?: string;
    cancelUrl?: string;
    options?: Record<string, unknown>;
  }) {
    const finalParams = {
      ...params,
      successUrl: params.successUrl ?? this.defaultReturnUrl,
    };
    return await this.post(`${this.prefix}/checkout`, finalParams);
  }

  // Subscription management
  async cancel(params: { productId: string; cancelAtPeriodEnd?: boolean }) {
    return await this.post(`${this.prefix}/cancel`, params);
  }

  // Feature checking
  async check(params: { featureId: string; delta?: number }) {
    return await this.post(`${this.prefix}/check`, params);
  }

  // Usage tracking
  async track(params: {
    featureId: string;
    delta?: number;
    entityId?: string;
    set?: number;
  }) {
    return await this.post(`${this.prefix}/track`, params);
  }

  // Billing portal
  async openBillingPortal(params?: { returnUrl?: string }) {
    const finalParams = {
      ...(params || {}),
      returnUrl: params?.returnUrl ?? this.defaultReturnUrl,
    };
    return await this.post(`${this.prefix}/billing_portal`, finalParams);
  }

  // Payment setup
  async setupPayment(params?: { successUrl?: string; cancelUrl?: string }) {
    const finalParams = {
      ...(params || {}),
      successUrl: params?.successUrl ?? this.defaultReturnUrl,
    };
    return await this.post(`${this.prefix}/setup_payment`, finalParams);
  }

  // Query
  async query(params: { query: string }) {
    return await this.post(`${this.prefix}/query`, params);
  }

  // Entity methods
  entities = {
    create: async (
      params:
        | { id: string; name?: string; featureId?: string }
        | { id: string; name?: string; featureId?: string }[]
    ) => {
      return await this.post(`${this.prefix}/entities`, params);
    },
    get: async (entityId: string, params?: { expand?: string[] }) => {
      const queryString = params?.expand
        ? `?expand=${params.expand.join(",")}`
        : "";
      return await this.get(`${this.prefix}/entities/${entityId}${queryString}`);
    },
    delete: async (params: { entityId: string }) => {
      return await this.delete(`${this.prefix}/entities/${params.entityId}`);
    },
  };

  // Referral methods
  referrals = {
    createCode: async (params: { code?: string; programId?: string }) => {
      return await this.post(`${this.prefix}/referrals/codes`, params);
    },
    redeemCode: async (params: { code: string }) => {
      return await this.post(`${this.prefix}/referrals/redeem`, params);
    },
  };

  // Product methods
  products = {
    list: async (): AutumnPromise<{ list: Product[] }> => {
      return await this.get(`${this.prefix}/products`);
    },
  };
}

