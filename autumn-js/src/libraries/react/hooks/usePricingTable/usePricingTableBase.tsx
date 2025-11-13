import type Autumn from "@sdk";
import useSWR, { type SWRConfiguration } from "swr";
import type { ConvexAutumnClient } from "@/client/ConvexAutumnClient";
import type { AutumnClient } from "@/client/ReactAutumnClient";

// const mergeProductDetails = (
//   products: Autumn.Plan[] | undefined,
//   productDetails?: ProductDetails[]
// ): ProductWithDisplay[] | null => {
//   if (!products) {
//     return null;
//   }

//   if (!productDetails) {
//     return products.map((product) => {
//       if (product.base_variant_id) {
//         let baseProduct = products.find(
//           (p) => p.id === product.base_variant_id
//         );
//         if (baseProduct) {
//           return {
//             ...product,
//             name: baseProduct.name,
//           };
//         }
//       }

//       return product;
//     });
//   }

//   let fetchedProducts = structuredClone(products);

//   let mergedProducts: ProductWithDisplay[] = [];

//   for (const overrideDetails of productDetails) {
//     if (!overrideDetails.id) {
//       let properties: any = {};
//       let overrideItems = overrideDetails.items?.map((item) => ({
//         display: {
//           primary_text: item.primaryText,
//           secondary_text: item.secondaryText,
//         },
//       }));

//       let overridePrice = overrideDetails.price;
//       if (overrideDetails.price) {
//         properties.is_free = false;
//         overrideItems = [
//           {
//             display: {
//               primary_text: overridePrice?.primaryText,
//               secondary_text: overridePrice?.secondaryText,
//             },
//           },
//           ...(overrideItems || []),
//         ];
//       }

//       if (!overrideItems || overrideItems.length === 0) {
//         overrideItems = [
//           {
//             display: {
//               primary_text: "",
//             },
//           },
//         ] as any;
//       }

//       mergedProducts.push({
//         display: {
//           name: overrideDetails.name,
//           description: overrideDetails.description,
//           button_text: overrideDetails.buttonText,
//           recommend_text: overrideDetails.recommendText,
//           everything_from: overrideDetails.everythingFrom,
//           button_url: overrideDetails.buttonUrl,
//         },
//         items: overrideItems,
//         properties,
//       } as unknown as Autumn.Plan);
//       continue;
//     }

//     let fetchedProduct = fetchedProducts.find(
//       (p) => p.id === overrideDetails.id
//     );

//     if (!fetchedProduct) {
//       continue;
//     }

//     let displayName = fetchedProduct.name;
//     let baseVariantId = fetchedProduct.base_variant_id;
//     if (baseVariantId) {
//       let baseProduct = fetchedProducts.find((p) => p.id === baseVariantId);
//       if (baseProduct) {
//         displayName = baseProduct.name;
//       }
//     }
//     displayName = overrideDetails.name || displayName;

//     const originalIsFree = fetchedProduct.properties?.is_free;
//     let overrideProperties = fetchedProduct.properties || {};
//     let overrideItems = overrideDetails.items;
//     let overridePrice = overrideDetails.price;
//     let mergedItems: Autumn.Plan.Feature[] = [];

//     if (overridePrice) {
//       // overrideProperties.is_free = false;

//       if (originalIsFree || overrideItems !== undefined) {
//         mergedItems.push({
//           display: {
//             primary_text: overridePrice.primaryText,
//             secondary_text: overridePrice.secondaryText,
//           },
//         });
//       } else {
//         fetchedProduct.items[0].display = {
//           primary_text: overridePrice.primaryText,
//           secondary_text: overridePrice.secondaryText,
//         };
//       }
//     } else {
//       if (overrideItems && !originalIsFree) {
//         mergedItems.push(fetchedProduct.items[0]);
//       }
//     }

//     if (overrideItems) {
//       for (const overrideItem of overrideItems) {
//         if (!overrideItem.featureId) {
//           mergedItems.push({
//             display: {
//               primary_text: overrideItem.primaryText || "",
//               secondary_text: overrideItem.secondaryText,
//             },
//           });
//         } else {
//           let fetchedItem = fetchedProduct.items.find(
//             (i) => i.feature_id === overrideItem.featureId
//           );
//           if (!fetchedItem) {
//             console.error(
//               `Feature with id ${overrideItem.featureId} not found for product ${fetchedProduct.id}`
//             );
//             continue;
//           }
//           mergedItems.push({
//             ...fetchedItem,
//             display: {
//               primary_text:
//                 overrideItem.primaryText || fetchedItem.display?.primary_text || "",
//               secondary_text:
//                 overrideItem.secondaryText ||
//                 fetchedItem.display?.secondary_text,
//             },
//           });
//         }
//       }
//     } else {
//       mergedItems = fetchedProduct.items;
//     }

//     const mergedProduct: Autumn.Product & { display: {
//       name?: string;
//       description?: string;
//       button_text?: string;
//       recommend_text?: string;
//       everything_from?: string;
//       button_url?: string;
//     } } = {
//       ...fetchedProduct,
//       items: mergedItems,
//       properties: overrideProperties as Autumn.Product["properties"],
//       display: {
//         name: displayName,
//         description: overrideDetails.description,
//         button_text: overrideDetails.buttonText,
//         recommend_text: overrideDetails.recommendText,
//         everything_from: overrideDetails.everythingFrom,
//         button_url: overrideDetails.buttonUrl,
//       },
//     };

//     mergedProducts.push(mergedProduct);
//   }
//   return mergedProducts;
// };

const defaultSWRConfig: SWRConfiguration = {
	refreshInterval: 0,
	shouldRetryOnError: false,
};

import type { PricingCardData, PricingCardOverride } from "./pricingCardTypes";

const getCardData = ({
	plans,
	override,
}: {
	plans: Autumn.Plan[];
	override: PricingCardOverride;
}): PricingCardData => {
	// 1. Override doesn't contain plan ID
	const plan = plans.find((p) => p.id === override.planId);

	const parseDisplay = (d?: {
		primaryText?: string;
		secondaryText?: string;
	}) => {
		if (!d) return undefined;
		return {
			primary_text: d.primaryText,
			secondary_text: d.secondaryText,
		};
	};

	if (!override?.planId || !plan) {
		return {
			plan: null,
			override: {
				name: override.name,
				description: override.description,
				recommend_text: override.recommendText,
				everything_from: override.everythingFrom,
				button: {
					text: override.button?.text,
					onClick: override.button?.onClick,
				},
				price: {
					display: parseDisplay(override.price?.display),
				},
				features: override.features?.map((feature) => ({
					feature_id: feature.featureId,
					display: parseDisplay(feature.display),
				})),
			},
		};
	}

	// 2. Override plan data
	const overrideFeatures = override.features
		? override.features.map((f) => {
				// 1. If feature ID is null, just
				const planFeature = plan?.features?.find(
					(p) => p.feature_id === f.featureId,
				);

				if (!f.featureId || !planFeature) {
					return {
						feature_id: null,
						display: parseDisplay(f.display),
					};
				}

				return {
					feature_id: f.featureId,
					display: f.display
						? parseDisplay(f.display)
						: (planFeature.display ?? undefined),
				};
			})
		: undefined;

	const overridePlanData = {
		name: override.name,
		description: override.description,
		recommend_text: override.recommendText,
		everything_from: override.everythingFrom,
		button: {
			text: override.button?.text,
			onClick: override.button?.onClick,
		},
		price: {
			display: parseDisplay(override.price?.display),
		},

		features: overrideFeatures,
	};

	return {
		plan,
		override: overridePlanData,
	};
};

export const usePricingTableBase = ({
	client,
	params,
}: {
	client: AutumnClient | ConvexAutumnClient;
	params?: {
		overrides?: PricingCardOverride[];
	};
}): {
	data: PricingCardData[];
	isLoading: boolean;
	error: Error | null;
	refetch: () => void;
} => {
	const fetcher = async () => {
		const data = await client.plans.list();

		return data?.list || [];
	};

	const { data, error, mutate } = useSWR<Autumn.Plan[]>(
		["pricing-table", client.backendUrl],
		fetcher,
		{ ...defaultSWRConfig },
	);

	const plans = data || [];

	const pricingCardData = params?.overrides
		? params.overrides.map((override) => getCardData({ plans, override }))
		: plans.map((plan) => ({ plan, override: {} }));

	return {
		data: pricingCardData,
		isLoading: !error && !data,
		error,
		refetch: mutate,
	};
};
