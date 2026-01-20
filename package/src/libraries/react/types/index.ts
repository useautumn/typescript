/**
 * Re-exports from ts-sdk (Stainless-generated types from OpenAPI)
 * This file serves as the single source of truth for all types in autumn-js/react
 */

// ============================================================================
// Core Response Types (V2 Schema)
// ============================================================================
export type {
  Customer,
  CustomerData,
  Entity,
  EntityData,
  Plan,
  PlanFeature,
} from "@useautumn/sdk/resources/shared";

// ============================================================================
// Operation Response Types
// ============================================================================
export type {
  AttachResponse,
  BillingPortalResponse,
  CancelResponse,
  CheckResponse,
  CheckoutResponse,
  QueryResponse,
  SetupPaymentResponse,
  TrackResponse,
} from "@useautumn/sdk/resources/top-level";

// ============================================================================
// Operation Parameter Types
// ============================================================================
export type {
  AttachParams,
  BillingPortalParams,
  CancelParams,
  CheckParams,
  CheckoutParams,
  QueryParams,
  SetupPaymentParams,
  TrackParams,
} from "@useautumn/sdk/resources/top-level";

// ============================================================================
// Customer Operations
// ============================================================================
export type {
  CustomerCreateParams,
  CustomerUpdateParams,
  CustomerListParams,
  CustomerGetParams,
  CustomerListResponse,
  CustomerDeleteResponse,
} from "@useautumn/sdk/resources/customers";

// ============================================================================
// Entity Operations
// ============================================================================
export type {
  EntityCreateParams,
  EntityDeleteParams,
  EntityGetParams,
  EntityDeleteResponse,
} from "@useautumn/sdk/resources/entities";

// ============================================================================
// Plan Operations
// ============================================================================
export type {
  PlanCreateParams,
  PlanUpdateParams,
  PlanListParams,
  PlanDeleteParams,
  PlanListResponse,
  PlanDeleteResponse,
} from "@useautumn/sdk/resources/plans";

// ============================================================================
// Event Operations
// ============================================================================
export type {
  EventListParams,
  EventAggregateParams,
  EventListResponse,
  EventAggregateResponse,
} from "@useautumn/sdk/resources/events";

// ============================================================================
// Referral Operations
// ============================================================================
export type {
  ReferralCreateCodeParams,
  ReferralRedeemCodeParams,
  ReferralCreateCodeResponse,
  ReferralRedeemCodeResponse,
} from "@useautumn/sdk/resources/referrals";

// ============================================================================
// Balance Operations
// ============================================================================
export type {
  BalanceCreateParams,
  BalanceUpdateParams,
  BalanceCreateResponse,
  BalanceUpdateResponse,
} from "@useautumn/sdk/resources/balances";

// ============================================================================
// Type Aliases for Backwards Compatibility / Convenience
// ============================================================================

// Subscription is nested under Customer
export type Subscription = Customer.Subscription;
export type ScheduledSubscription = Customer.ScheduledSubscription;
export type CustomerBalances = Customer.Balances;

// Entity subscriptions/balances
export type EntitySubscription = Entity.Subscription;
export type EntityBalances = Entity.Balances;

// Check response types
export type CheckPreview = CheckResponse.Preview;
export type CheckBalance = CheckResponse.Balance;

// Import Customer and Entity for the aliases above
import type { Customer, Entity } from "@useautumn/sdk/resources/shared";
import type { CheckResponse } from "@useautumn/sdk/resources/top-level";

// ============================================================================
// Expand Options
// ============================================================================
export type CustomerExpandOption = 
  | "invoices" 
  | "entities" 
  | "referrals" 
  | "rewards" 
  | "trials_used" 
  | "payment_method";

export type EntityExpandOption = 
  | "invoices" 
  | "subscriptions" 
  | "balances";

// ============================================================================
// Utility Types
// ============================================================================

/**
 * Utility type that creates a Customer with additional expanded fields
 * based on the expand array passed to the API.
 */
export type ExpandedCustomer<
  T extends readonly CustomerExpandOption[] = readonly [],
> = Customer & {
  [K in T[number]]: K extends "invoices"
    ? Customer.Invoice[]
    : K extends "entities"
    ? Customer.Entity[]
    : K extends "referrals"
    ? Customer.Referral[]
    : K extends "rewards"
    ? Customer.Rewards | null
    : K extends "trials_used"
    ? Customer.TrialsUsed[]
    : K extends "payment_method"
    ? unknown
    : never;
};

/**
 * Utility type for Entity with expanded fields
 */
export type ExpandedEntity<
  T extends readonly EntityExpandOption[] = readonly [],
> = Entity & {
  [K in T[number]]: K extends "invoices"
    ? Entity.Invoice[]
    : K extends "subscriptions"
    ? Entity.Subscription[]
    : K extends "balances"
    ? { [key: string]: Entity.Balances }
    : never;
};
