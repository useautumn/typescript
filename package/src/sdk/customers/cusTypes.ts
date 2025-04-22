import { AppEnv } from "../general/genEnums";
import { ProductItemInterval } from "../products/prodEnums";
import { ProductStatus } from "./cusEnums";

export interface CustomerFeature {
  feature_id: string;
  unlimited?: boolean;

  interval?: ProductItemInterval | null;
  balance?: number;
  usage?: number;
  included_usage?: number;
  next_reset_at?: number;
}

export interface CustomerProduct {
  id: string;
  name: string | null;
  group: string | null;
  status: ProductStatus;
  started_at: number;
  canceled_at: number | null;

  subscription_ids?: string[] | null;
  current_period_start?: number | null;
  current_period_end?: number | null;
}

export interface Customer {
  // Internal fields
  autumn_id: string;
  created_at: number;
  env: AppEnv;

  id: string | null;
  name: string | null;
  email: string | null;
  fingerprint: string | null;
  stripe_id: string | null;

  products: CustomerProduct[];
  add_ons: CustomerProduct[];
  features: CustomerFeature[];
}

export interface CustomerData {
  name?: string;
  email?: string;
  fingerprint?: string;
}

export interface CreateCustomerParams {
  id?: string | null;
  email?: string | null;
  name?: string | null;
  fingerprint?: string | null;
}

export interface UpdateCustomerParams {
  id?: string | null;
  name?: string | null;
  email?: string | null;
  fingerprint?: string | null;
}

export interface BillingPortalParams {
  return_url?: string;
}

export interface BillingPortalResponse {
  customer_id: string;
  url: string;
}
