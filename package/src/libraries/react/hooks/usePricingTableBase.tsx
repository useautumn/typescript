import useSWR, { SWRConfiguration } from "swr";
import type { Plan } from "@/types";
import { AutumnError } from "../../../sdk/error";
import { ProductDetails } from "../client/types/clientPricingTableTypes";
import { AutumnContextParams, useAutumnContext } from "../AutumnContext";
import { AutumnClient } from "@/client/ReactAutumnClient";
import { ConvexAutumnClient } from "@/client/ConvexAutumnClient";

const mergePlanDetails = (
  plans: Plan[] | undefined,
  productDetails?: ProductDetails[]
): Plan[] | null => {
  if (!plans) {
    return null;
  }

  if (!productDetails) {
    return plans.map((plan) => {
      if (plan.base_variant_id) {
        let basePlan = plans.find(
          (p) => p.id === plan.base_variant_id
        );
        if (basePlan) {
          return {
            ...plan,
            name: basePlan.name,
          };
        }
      }

      return plan;
    });
  }

  let fetchedPlans = structuredClone(plans);

  let mergedPlans: Plan[] = [];

  for (const overrideDetails of productDetails) {
    if (!overrideDetails.id) {
      let properties: any = {};
      let overrideItems = overrideDetails.items?.map((item) => ({
        display: {
          primary_text: item.primaryText,
          secondary_text: item.secondaryText,
        },
      }));

      let overridePrice = overrideDetails.price;
      if (overrideDetails.price) {
        properties.is_free = false;
        overrideItems = [
          {
            display: {
              primary_text: overridePrice?.primaryText,
              secondary_text: overridePrice?.secondaryText,
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
        properties,
      } as unknown as Plan);
      continue;
    }

    let fetchedPlan = fetchedPlans.find(
      (p) => p.id === overrideDetails.id
    );

    if (!fetchedPlan) {
      continue;
    }

    let displayName = fetchedPlan.name;
    let baseVariantId = fetchedPlan.base_variant_id;
    if (baseVariantId) {
      let basePlan = fetchedPlans.find((p) => p.id === baseVariantId);
      if (basePlan) {
        displayName = basePlan.name;
      }
    }
    displayName = overrideDetails.name || displayName;

    const originalIsFree = (fetchedPlan as any).properties?.is_free;
    let overrideProperties = (fetchedPlan as any).properties || {};
    let overrideItems = overrideDetails.items;
    let overridePrice = overrideDetails.price;
    let mergedFeatures: any[] = [];

    if (overridePrice) {
      overrideProperties.is_free = false;

      if (originalIsFree || overrideItems !== undefined) {
        mergedFeatures.push({
          display: {
            primary_text: overridePrice.primaryText,
            secondary_text: overridePrice.secondaryText,
          },
        });
      } else {
        fetchedPlan.features[0].display = {
          primary_text: overridePrice.primaryText,
          secondary_text: overridePrice.secondaryText,
        };
      }
    } else {
      if (overrideItems && !originalIsFree) {
        mergedFeatures.push(fetchedPlan.features[0]);
      }
    }

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
          let fetchedFeature = fetchedPlan.features.find(
            (f) => f.feature_id === overrideItem.featureId
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
      mergedFeatures = fetchedPlan.features;
    }

    const mergedPlan: Plan = {
      ...fetchedPlan,
      features: mergedFeatures,
      properties: overrideProperties,
      display: {
        name: displayName,
        description: overrideDetails.description,
        button_text: overrideDetails.buttonText,
        recommend_text: overrideDetails.recommendText,
        everything_from: overrideDetails.everythingFrom,
        button_url: overrideDetails.buttonUrl,
      },
    } as unknown as Plan;

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
}): { plans: Plan[] | null; isLoading: boolean; error: AutumnError | undefined; refetch: () => void } => {
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
