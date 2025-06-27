import { Customer, CustomerFeature, Entity } from "@sdk";

export interface AllowedParams {
  featureId?: string;
  productId?: string;
  requiredBalance?: number;
}

const getCusFeature = ({
  customer,
  featureId,
  requiredBalance = 1,
}: {
  customer: Customer | Entity;
  featureId: string;
  requiredBalance?: number;
}) => {
  // 1. If credit system exists, use it
  let creditSchema = Object.values(customer.features).find((f: CustomerFeature) => f.credit_schema && f.credit_schema.some((c) => c.feature_id === featureId));
  
  if (creditSchema) {
    let schemaItem = creditSchema.credit_schema?.find((c) => c.feature_id === featureId)!;
    return {
      feature: creditSchema,
      requiredBalance: schemaItem.credit_amount * requiredBalance,
    };
  }

  // 2. If no credit system exists, use the feature
  return {
    cusFeature: customer.features[featureId],
    requiredBalance: requiredBalance,
  };
}

const handleFeatureAllowed = ({ customer, params }: {
  customer: Customer | Entity,
  params: AllowedParams
}) => {
  // 1. Get feature to use...
  let { cusFeature, requiredBalance } = getCusFeature({ customer, featureId: params.featureId! });

  

  if (!cusFeature) return false;

  if (cusFeature.type == "static") return true;

  if (cusFeature.unlimited || cusFeature.overage_allowed) return true;

  

  return (cusFeature.balance || 0) >= requiredBalance;
}


export const handleAllowed = ({ customer, params }: { customer: Customer | Entity | null, params: AllowedParams }) => {
  if (!customer) return false;

  if (!params.featureId && !params.productId) {
    throw new Error("allowed() requires either featureId or productId")
  }

  if (params.featureId) {
    return handleFeatureAllowed({ customer, params });
  }

  if (params.productId) {
    let product = customer.products.find((p) => p.id == params.productId);
    if (!product) return false;

    let status = product.status;
    if (status == "scheduled") return false;

    return true;
  }

  return false;
} 