import {
  handleAttach,
  handleCancel,
  handleCheck,
  handleCheckout,
  handleEntitled,
  handleEvent,
  handleQuery,
  handleSetupPayment,
  handleTrack,
  handleUsage,
} from "./general/genMethods";

import {
  CancelParams,
  CheckParams,
  SetupPaymentParams,
  TrackParams,
  UsageParams,
} from "./general/genTypes";

import { AttachParams, CheckoutParams } from "./general/attachTypes";

import { autumnApiUrl } from "../libraries/backend/constants";
import { customerMethods } from "./customers/cusMethods";
import { entityMethods } from "./customers/entities/entMethods";
import { productMethods } from "./products/prodMethods";
import { referralMethods } from "./referrals/referralMethods";
import { toContainerResult } from "./response";
import { staticWrapper } from "./utils";
import { logger } from "../utils/logger";
import { featureMethods } from "./features/featureMethods";
import { eventMethods } from "./events/eventMethods";
import { QueryParams } from "./events/eventTypes";
import { balanceMethods } from "./balances/balancesMethods";

const LATEST_API_VERSION = "1.2";

export class Autumn {
  private readonly secretKey: string | undefined;
  private readonly publishableKey: string | undefined;
  private headers: Record<string, string>;
  private url: string;
  private logger: any = console;
  public readonly defaultReturnUrl?: string;

  constructor(options?: {
    secretKey?: string;
    publishableKey?: string;
    url?: string;
    version?: string;
    headers?: Record<string, string>;
    logLevel?: string;
    defaultReturnUrl?: string;
  }) {
    try {
      this.secretKey = options?.secretKey || process.env.AUTUMN_SECRET_KEY;
      this.publishableKey =
        options?.publishableKey || process.env.AUTUMN_PUBLISHABLE_KEY;
    } catch (error) {}

    if (!this.secretKey && !this.publishableKey && !options?.headers) {
      throw new Error("Autumn secret key or publishable key is required");
    }

    this.headers = options?.headers || {
      Authorization: `Bearer ${this.secretKey || this.publishableKey}`,
      "Content-Type": "application/json",
    };

    let version = options?.version || LATEST_API_VERSION;
    this.headers["x-api-version"] = version;
    this.url = options?.url || autumnApiUrl;

    this.logger = logger;
    this.logger.level = options?.logLevel || "info";
    this.defaultReturnUrl = options?.defaultReturnUrl;
  }

  async get(path: string) {
    const response = await fetch(`${this.url}${path}`, {
      headers: this.headers,
    });

    return toContainerResult({ response, logger: this.logger });
  }

  async post(path: string, body: any) {
    try {
      const response = await fetch(`${this.url}${path}`, {
        method: "POST",
        headers: this.headers,
        body: JSON.stringify(body),
      });

      return toContainerResult({ response, logger: this.logger });
    } catch (error) {
      console.error("Error sending request:", error);
      throw error;
    }
  }

  async delete(path: string) {
    const response = await fetch(`${this.url}${path}`, {
      method: "DELETE",
      headers: this.headers,
    });
    return toContainerResult({ response, logger: this.logger });
  }

  static customers = customerMethods();
  static products = productMethods();
  static entities = entityMethods();
  static referrals = referralMethods();
  static features = featureMethods();
  static events = eventMethods();
  static balances = balanceMethods();

  customers = customerMethods(this);
  products = productMethods(this);
  entities = entityMethods(this);
  referrals = referralMethods(this);
  features = featureMethods(this);
  events = eventMethods(this);
  balances = balanceMethods(this);


  /**
   * Initiates a checkout flow for a product purchase.
   * 
   * The checkout function handles the purchase process for products with pricing.
   * It determines whether to show a dialog for user input or redirect directly
   * to Stripe based on the customer's state and product requirements.
   * 
   * @param params - Checkout parameters including product ID, customer data, and options
   * @returns Promise resolving to checkout details including pricing, prorations, and URLs
   * 
   * @example
   * ```typescript
   * const result = await autumn.checkout({
   *   customer_id: "user_123",
   *   product_id: "pro",
   *   success_url: "https://myapp.com/success"
   * });
   * 
   * if (result.url) {
   *   // Redirect to Stripe checkout
   *   window.location.href = result.url;
   * }
   * ```
   */
  async checkout(params: CheckoutParams) {
    return handleCheckout({
      instance: this,
      params,
    });
  }

  static checkout = (params: CheckoutParams) =>
    staticWrapper(handleCheckout, undefined, { params });

  

  static usage = (params: UsageParams) =>
    staticWrapper(handleUsage, undefined, { params });

  /**
   * Attaches a product to a customer, enabling access and handling billing.
   * 
   * The attach function activates a product for a customer and applies all product items.
   * When you attach a product:
   * - The customer gains access to all features in the product
   * - If the product has prices, the customer will be billed accordingly  
   * - If there's no existing payment method, a checkout URL will be generated
   * 
   * @param params - Attach parameters including customer ID, product ID, and options
   * @returns Promise resolving to attachment result with checkout URL if needed
   * 
   * @example
   * ```typescript
   * const result = await autumn.attach({
   *   customer_id: "user_123",
   *   product_id: "pro",
   *   success_url: "https://myapp.com/success"
   * });
   * 
   * if (result.checkout_url) {
   *   // Payment required - redirect to checkout
   *   window.location.href = result.checkout_url;
   * } else {
   *   // Product successfully attached
   *   console.log("Access granted:", result.message);
   * }
   * ```
   */
  async attach(params: AttachParams) {
    return handleAttach({
      instance: this,
      params,
    });
  }
  static attach = (params: AttachParams) =>
    staticWrapper(handleAttach, undefined, { params });

  static setupPayment = (params: SetupPaymentParams) =>
    staticWrapper(handleSetupPayment, undefined, { params });
  /**
   * Sets up a payment method for a customer.
   * 
   * This method allows you to set up payment methods for customers without 
   * immediately charging them. Useful for collecting payment information
   * before product attachment or for updating existing payment methods.
   * 
   * @param params - Setup payment parameters including customer information
   * @returns Promise resolving to setup payment result
   * 
   * @example
   * ```typescript
   * const result = await autumn.setupPayment({
   *   customer_id: "user_123"
   * });
   * ```
   */
  async setupPayment(params: SetupPaymentParams) {
    return handleSetupPayment({
      instance: this,
      params,
    });
  }

  static cancel = (params: CancelParams) =>
    staticWrapper(handleCancel, undefined, { params });

  /**
   * Cancels a customer's subscription or product attachment.
   * 
   * This method allows you to cancel a customer's subscription to a specific product.
   * You can choose to cancel immediately or at the end of the billing cycle.
   * 
   * @param params - Cancel parameters including customer ID and product ID
   * @returns Promise resolving to cancellation result
   * 
   * @example
   * ```typescript
   * const result = await autumn.cancel({
   *   customer_id: "user_123",
   *   product_id: "pro",
   *   cancel_immediately: false // Cancel at end of billing cycle
   * });
   * ```
   */
  async cancel(params: CancelParams) {
    return handleCancel({
      instance: this,
      params,
    });
  }

  static check = (params: CheckParams) =>
    staticWrapper(handleCheck, undefined, { params });

  /**
   * Checks if a customer has access to a specific feature.
   * 
   * This method verifies whether a customer has permission to use a feature
   * and checks their remaining balance/usage limits. It can be used to gate
   * features and determine when to show upgrade prompts.
   * 
   * @param params - Check parameters including customer ID and feature ID
   * @returns Promise resolving to access check result with allowed status and balance info
   * 
   * @example
   * ```typescript
   * const result = await autumn.check({
   *   customer_id: "user_123",
   *   feature_id: "messages",
   *   required_balance: 1
   * });
   * 
   * if (!result.allowed) {
   *   console.log("Feature access denied - upgrade required");
   * }
   * ```
   */
  async check(params: CheckParams) {
    return handleCheck({
      instance: this,
      params,
    });
  }

  static track = (params: TrackParams) =>
    staticWrapper(handleTrack, undefined, { params });

  /**
   * Tracks usage events for features or analytics.
   * 
   * This method records usage events for metered features, updating the customer's
   * balance and usage statistics. It's typically used server-side to ensure
   * accurate tracking that cannot be manipulated by users.
   * 
   * @param params - Track parameters including customer ID, feature ID, and usage value
   * @returns Promise resolving to tracking result
   * 
   * @example
   * ```typescript
   * const result = await autumn.track({
   *   customer_id: "user_123",
   *   feature_id: "messages",
   *   value: 1 // Track 1 message sent
   * });
   * ```
   */
  async track(params: TrackParams) {
    return handleTrack({
      instance: this,
      params,
    });
  }

  /**
   * Retrieves usage statistics and analytics for a customer.
   * 
   * This method fetches detailed usage information for a customer's features,
   * including current balances, usage history, and analytics data. Useful
   * for displaying usage dashboards or generating reports.
   * 
   * @param params - Usage parameters including customer ID and optional filters
   * @returns Promise resolving to usage statistics and analytics data
   * 
   * @example
   * ```typescript
   * const result = await autumn.usage({
   *   customer_id: "user_123",
   *   feature_id: "messages" 
   *   value: 20 // Usage value
   * });
   * ```
   */
  async usage(params: UsageParams) {
    return handleUsage({
      instance: this,
      params,
    });
  }

  static query = (params: QueryParams) =>
    staticWrapper(handleQuery, undefined, { params });

  /**
   * Performs advanced queries on customer data and analytics.
   * 
   * This method allows you to run complex queries against customer data,
   * usage patterns, and billing information. Useful for generating reports,
   * analytics, and custom data insights.
   * 
   * @param params - Query parameters including customer ID and query specifications
   * @returns Promise resolving to query results with requested data
   * 
   * @example
   * ```typescript
   * const result = await autumn.query({
   *   customer_id: "user_123",
   *   feature_id: "messages" // feature id to fetch for query, can also be an array
   * });
   * 
   * ```
   */
  async query(params: QueryParams) {
    return handleQuery({
      instance: this,
      params,
    });
  }


}
