import useSWR, { SWRConfiguration } from "swr";
import type { Plan } from "@/types";
import { AutumnError } from "../../../sdk/error";
import { ProductDetails } from "../client/types/clientPricingTableTypes";
import { AutumnContextParams, useAutumnContext } from "../AutumnContext";
import { AutumnClient } from "@/client/ReactAutumnClient";
import { ConvexAutumnClient } from "@/client/ConvexAutumnClient";

// Properties computed from plan data for pricing table display
export interface PlanProperties {
  is_free: boolean;
  is_one_off: boolean;
  has_trial: boolean;
  interval_group: string | null;
  updateable: boolean;
}

// Extended plan type with computed properties for pricing table
export type PricingTablePlan = Plan & {
  display?: {
    name?: string;
    description?: string;
    button_text?: string;
    recommend_text?: string;
    everything_from?: string;
    button_url?: string;
  };
  properties?: PlanProperties;
};

// V1 API response type (what /products actually returns)
interface V1ProductItem {
  type: "price" | "feature";
  feature_id: string | null;
  interval?: string;
  price?: number;
  display?: { primary_text: string; secondary_text?: string };
}

interface V1Product {
  id: string;
  name: string;
  items: V1ProductItem[];
  properties?: PlanProperties;
  scenario?: string;
  free_trial?: { trial_available?: boolean } | null;
  // ... other fields
}

/**
 * Get properties from plan/product data.
 * The /products endpoint returns V1 schema with `properties` already computed.
 * Only compute if not provided (for V2 /plans endpoint or custom plans).
 */
const getPlanProperties = (plan: Plan | V1Product): PlanProperties => {
  // If properties already exist (V1 API), use them
  const existingProps = (plan as any).properties as PlanProperties | undefined;
  if (existingProps) {
    return existingProps;
  }

  // Otherwise compute from plan data (V2 API with features array)
  const features = (plan as Plan).features || [];
  const items = (plan as V1Product).items || [];
  
  // Use features if available (V2), otherwise items (V1)
  const planItems = features.length > 0 ? features : items;
  
  // is_free: no base price AND no paid features/items
  const hasPaidItems = planItems.some((f: any) => 
    f.price !== null && f.price !== undefined && f.type !== "feature"
  );
  const is_free = (plan as Plan).price === null && !hasPaidItems;

  // is_one_off: base price has one_off interval
  const basePrice = (plan as Plan).price;
  const firstPriceItem = planItems.find((f: any) => f.type === "price" || f.price !== null);
  const is_one_off = basePrice?.interval === "one_off" || 
    (firstPriceItem as any)?.interval === "one_off";

  // has_trial: check customer_eligibility, free_trial.trial_available, or free_trial existence
  const customerEligibility = (plan as Plan).customer_eligibility;
  const freeTrial = plan.free_trial;
  const has_trial = customerEligibility?.trial_available ?? 
    (freeTrial as any)?.trial_available ??
    (freeTrial !== null && freeTrial !== undefined);

  // interval_group: derived from base price or first item with interval
  let interval_group: string | null = null;
  if (basePrice?.interval) {
    interval_group = basePrice.interval;
  } else if (firstPriceItem) {
    interval_group = (firstPriceItem as any).interval || null;
  }

  // updateable: has prepaid features (V2 schema)
  const updateable = features.some(
    (f: any) => f.price?.usage_model === "prepaid"
  );

  return {
    is_free,
    is_one_off,
    has_trial,
    interval_group: interval_group,
    updateable,
  };
};

/**
 * Get the features/items array from a plan (handles both V1 and V2 schemas)
 * V1 API returns `items`, V2 API returns `features`
 */
const getPlanItems = (plan: Plan | V1Product): any[] => {
  return (plan as Plan).features || (plan as V1Product).items || [];
};

const mergePlanDetails = (
  plans: Plan[] | undefined,
  productDetails?: ProductDetails[]
): PricingTablePlan[] | null => {
  if (!plans) {
    return null;
  }

  // If no productDetails provided, return all plans with properties
  if (!productDetails) {
    return plans.map((plan): PricingTablePlan => {
      let displayName = plan.name;
      if (plan.base_variant_id) {
        const basePlan = plans.find((p) => p.id === plan.base_variant_id);
        if (basePlan) {
          displayName = basePlan.name;
        }
      }

      // Normalize items (V1) to features for consistent access
      const features = getPlanItems(plan);

      return {
        ...plan,
        features,
        properties: getPlanProperties(plan),
        display: {
          name: displayName,
        },
      };
    });
  }

  const fetchedPlans = structuredClone(plans);
  const mergedPlans: PricingTablePlan[] = [];

  for (const overrideDetails of productDetails) {
    // Handle custom plans (no id - purely from productDetails)
    if (!overrideDetails.id) {
      let overrideItems = overrideDetails.items?.map((item) => ({
        display: {
          primary_text: item.primaryText,
          secondary_text: item.secondaryText,
        },
      }));

      const overridePrice = overrideDetails.price;
      if (overridePrice) {
        overrideItems = [
          {
            display: {
              primary_text: overridePrice.primaryText,
              secondary_text: overridePrice.secondaryText,
            },
          },
          ...(overrideItems || []),
        ];
      }

      if (!overrideItems || overrideItems.length === 0) {
        overrideItems = [
          {
            display: {
              primary_text: "",
            },
          },
        ] as any;
      }

      // Custom plan properties - compute based on provided details
      const customProperties: PlanProperties = {
        is_free: !overridePrice,
        is_one_off: false,
        has_trial: false,
        interval_group: null,
        updateable: false,
      };

      mergedPlans.push({
        display: {
          name: overrideDetails.name,
          description: overrideDetails.description,
          button_text: overrideDetails.buttonText,
          recommend_text: overrideDetails.recommendText,
          everything_from: overrideDetails.everythingFrom,
          button_url: overrideDetails.buttonUrl,
        },
        features: overrideItems,
        properties: customProperties,
      } as unknown as PricingTablePlan);
      continue;
    }

    // Find the fetched plan to merge with
    const fetchedPlan = fetchedPlans.find((p) => p.id === overrideDetails.id);
    if (!fetchedPlan) {
      continue;
    }

    // Get properties from the fetched plan (or compute if not provided)
    const computedProperties = getPlanProperties(fetchedPlan);

    // Determine display name
    let displayName = fetchedPlan.name;
    if (fetchedPlan.base_variant_id) {
      const basePlan = fetchedPlans.find((p) => p.id === fetchedPlan.base_variant_id);
      if (basePlan) {
        displayName = basePlan.name;
      }
    }
    displayName = overrideDetails.name || displayName;

    const overrideItems = overrideDetails.items;
    const overridePrice = overrideDetails.price;
    let mergedFeatures: any[] = [];
    let finalProperties = { ...computedProperties };

    // Get items/features array (handles both V1 and V2 schemas)
    const fetchedItems = getPlanItems(fetchedPlan);

    // Handle price override
    if (overridePrice) {
      finalProperties.is_free = false;

      if (computedProperties.is_free || overrideItems !== undefined) {
        // Add price as first feature
        mergedFeatures.push({
          display: {
            primary_text: overridePrice.primaryText,
            secondary_text: overridePrice.secondaryText,
          },
        });
      } else {
        // Override existing first item's display
        fetchedItems[0].display = {
          primary_text: overridePrice.primaryText,
          secondary_text: overridePrice.secondaryText,
        };
      }
    } else {
      // No price override - keep first item if not free and items are being overridden
      if (overrideItems && !computedProperties.is_free) {
        mergedFeatures.push(fetchedItems[0]);
      }
    }

    // Handle feature items override
    if (overrideItems) {
      for (const overrideItem of overrideItems) {
        if (!overrideItem.featureId) {
          mergedFeatures.push({
            display: {
              primary_text: overrideItem.primaryText,
              secondary_text: overrideItem.secondaryText,
            },
          });
        } else {
          const fetchedFeature = fetchedItems.find(
            (f: any) => f.feature_id === overrideItem.featureId
          );
          if (!fetchedFeature) {
            console.error(
              `Feature with id ${overrideItem.featureId} not found for plan ${fetchedPlan.id}`
            );
            continue;
          }
          mergedFeatures.push({
            ...fetchedFeature,
            display: {
              primary_text:
                overrideItem.primaryText || fetchedFeature.display?.primary_text,
              secondary_text:
                overrideItem.secondaryText ||
                fetchedFeature.display?.secondary_text,
            },
          });
        }
      }
    } else {
      mergedFeatures = fetchedItems;
    }

    const mergedPlan: PricingTablePlan = {
      ...fetchedPlan,
      features: mergedFeatures,
      properties: finalProperties,
      display: {
        name: displayName,
        description: overrideDetails.description,
        button_text: overrideDetails.buttonText,
        recommend_text: overrideDetails.recommendText,
        everything_from: overrideDetails.everythingFrom,
        button_url: overrideDetails.buttonUrl,
      },
    };

    mergedPlans.push(mergedPlan);
  }
  return mergedPlans;
};

const defaultSWRConfig: SWRConfiguration = {
  refreshInterval: 0,
};

export const usePricingTableBase = ({
  client,
  params,
}: {
  client: AutumnClient | ConvexAutumnClient;
  params?: {
    productDetails?: ProductDetails[];
  };
}): { plans: PricingTablePlan[] | null; isLoading: boolean; error: AutumnError | undefined; refetch: () => void } => {
  const fetcher = async () => {
    try {
      // Note: client.products.list() returns Plan[] in V2 (the endpoint returns plans)
      const { data, error } = await client.products.list();
      if (error) throw error;

      return (data?.list || []) as Plan[];
    } catch (error) {
      throw new AutumnError({
        message: "Failed to fetch pricing table plans",
        code: "failed_to_fetch_pricing_table_plans",
      });
    }
  };

  const { data, error, mutate } = useSWR<Plan[], AutumnError>(
    ["pricing-table", client.backendUrl],
    fetcher,
    { ...defaultSWRConfig }
  );

  return {
    plans: mergePlanDetails(data || [], params?.productDetails),
    isLoading: !error && !data,
    error,
    refetch: mutate,
  };
};
