import { CustomerData } from "../customers/cusTypes";

// Attach
export interface AttachFeatureOptions {
  feature_id: string;
  quantity: number;
}

export interface AttachParams {
  customer_id: string;
  product_id: string;
  options?: AttachFeatureOptions[];

  product_ids?: string[]; // If set, will attach multiple products to the customer (cannot be used with product_id)
  free_trial?: boolean; // Default is true -- if set to false, will bypass product free trial
  success_url?: string; // Passed to Stripe
  metadata?: Record<string, string>; // Passed to Stripe
  force_checkout?: boolean; // Default is false -- if set to true, will force the customer to checkout (not allowed for upgrades / downgrades)
}

export interface AttachResult {
  checkout_url?: string;
  customer_id: string;
  product_ids: string[];
  code: string;
  message: string;
}

// Events
export interface EventParams {
  customer_id: string;
  customer_data?: CustomerData;
  value?: number; // Defaults to 1

  feature_id?: string;
  event_name?: string;
}

export interface EventResult {
  id: string; // Event ID
  code: string; // Success code
  customer_id: string; // Customer ID

  feature_id?: string; // Feature ID
  event_name?: string; // Event name
}

// Entitled
export interface EntitledParams {
  customer_id: string;
  feature_id: string;
  required_quantity?: number;
  customer_data?: CustomerData;
}

export interface EntitledBalance {
  feature_id: string;
  unlimited: boolean;
  usage_allowed: boolean;
  required_quantity: number | null;
  balance: number | null;
}

export interface EntitledResult {
  customer_id: string; // Customer ID
  feature_id: string; // Feature ID
  code: string; // Success code

  allowed: boolean; // Whether the customer is allowed to use the feature
  balances: EntitledBalance[]; // Balances for each entity
}
