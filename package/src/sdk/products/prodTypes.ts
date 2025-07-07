import { ProductScenario } from "@sdk/general/checkTypes";
import { AppEnv } from "../general/genEnums";
import {
  FreeTrialDuration,
  Infinite,
  ProductItemIntervalType,
  UsageModel,
} from "./prodEnums";

export interface PriceTier {
  to: number;
  amount: number | "inf";
}

export interface ProductItem {
  feature_id?: string;
  included_usage?: number | typeof Infinite;
  interval?: ProductItemIntervalType;

  // Price config
  usage_model?: UsageModel;
  price?: number;
  billing_units?: number;
  entity_feature_id?: string;
  reset_usage_when_enabled?: boolean;

  quantity?: number;
  next_cycle_quantity?: number;

  display?: {
    primary_text?: string;
    secondary_text?: string;
  };
}

export interface FreeTrial {
  duration: FreeTrialDuration;
  length: number;
  unique_fingerprint: boolean;
  trial_available?: boolean;
}

export interface Product {
  id: string;
  created_at: number;
  name: string;
  env: AppEnv;

  is_add_on: boolean;
  is_default: boolean;
  group: string;
  version: number;

  items: ProductItem[];
  free_trial: FreeTrial | null;

  scenario?: ProductScenario;
  base_variant_id: string | null;

  properties?: {
    is_free?: boolean;
    is_one_off?: boolean;
    interval_group?: string;
  };

  display?: {
    name?: string;
    description?: string;
    button_text?: string;
    recommend_text?: string;
    everything_from?: string;
    button_url?: string;
  };
}

export interface CreateProductParams {
  id: string;
  name?: string;
  is_add_on?: boolean;
  is_default?: boolean;
  items?: ProductItem[];
  free_trial?: FreeTrial;
}

export interface ListProductsParams {
  customer_id?: string;
}
