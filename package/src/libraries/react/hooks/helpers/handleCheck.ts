import { AutumnContextParams } from "@/AutumnContext";
import { CheckParams } from "@/client/types/clientGenTypes";
import {
  AutumnError,
  CheckFeatureResult,
  CheckFeatureResultSchema,
  CheckProductResult,
  CheckResult,
  Customer,
  CustomerFeature,
  Entity,
} from "@sdk";
import { Result } from "@sdk/response";

export interface AllowedParams {
  featureId?: string;
  productId?: string;
  requiredBalance?: number;
}

const getCusFeature = ({
  customer,
  featureId,
  requiredBalance,
}: {
  customer: Customer | Entity;
  featureId: string;
  requiredBalance?: number;
}) => {
  // 1. If credit system exists, use it
  let creditSchema = Object.values(customer.features).find(
    (f: CustomerFeature) =>
      f.credit_schema && f.credit_schema.some((c) => c.feature_id === featureId)
  );

  // 1. If there's a cusFeature and balance > requiredBalance, use it...
  let cusFeature = customer.features[featureId];
  if (cusFeature && typeof cusFeature.balance === "number" && cusFeature.balance >= (requiredBalance ?? 1)) {
    return {
      cusFeature,
      requiredBalance: requiredBalance,
    };
  }

  // 2. If there's a credit schema, use it...
  if (creditSchema) {
    let schemaItem = creditSchema.credit_schema?.find(
      (c) => c.feature_id === featureId
    )!;

    return {
      cusFeature: creditSchema,
      requiredBalance: schemaItem.credit_amount * (requiredBalance ?? 1),
    };
  }

  // 2. If no credit system exists, use the feature
  return {
    cusFeature: customer.features[featureId],
    requiredBalance: requiredBalance,
  };
};

const getFeatureAllowed = ({
  cusFeature,
  requiredBalance,
}: {
  cusFeature: CustomerFeature | undefined;
  requiredBalance: number;
}) => {
  if (!cusFeature) return false;
  if (cusFeature.type == "static") return true;
  if (cusFeature.unlimited || cusFeature.overage_allowed) return true;
  if (cusFeature.usage_limit) {
    let extraUsage =
      (cusFeature.usage_limit || 0) - (cusFeature.included_usage || 0);
    return (cusFeature.balance || 0) + extraUsage >= requiredBalance;
  }
  return (cusFeature.balance || 0) >= requiredBalance;
};

const handleFeatureCheck = ({
  customer,
  isEntity,
  params,
}: {
  customer: Customer | Entity;
  isEntity?: boolean;
  params: AllowedParams;
}) => {
  // 1. Get feature to use...
  let { cusFeature, requiredBalance } = getCusFeature({
    customer,
    featureId: params.featureId!,
  });

  console.log("Cus Feature", cusFeature);
  console.log("Required Balance", requiredBalance);

  let allowed = getFeatureAllowed({ cusFeature, requiredBalance: requiredBalance ?? 1 });

  let result = {
    allowed,
    feature_id: params.featureId!,
    customer_id: isEntity ? (customer as Entity).customer_id : customer.id,
    required_balance: requiredBalance,
    ...cusFeature,
  } as CheckFeatureResult;

  if (isEntity) {
    result.entity_id = (customer as Entity).id;
  }

  try {
    return CheckFeatureResultSchema.parse(result);
  } catch (error) {
    return result;
  }
};

const handleProductCheck = ({
  customer,
  isEntity,
  params,
}: {
  customer: Customer | Entity;
  isEntity?: boolean;
  params: AllowedParams;
}) => {
  let product = customer.products.find((p) => p.id == params.productId);
  let allowed = product?.status === "active";

  let result = {
    allowed,
    customer_id: isEntity ? (customer as Entity).customer_id : customer.id,
    product_id: params.productId!,
  } as CheckProductResult;
  if (product) {
    result.status = product.status;
  }

  if (isEntity) {
    result.entity_id = (customer as Entity).id;
  }

  return result;
};

export const openDialog = ({
  result,
  params,
  context,
}: {
  result: CheckResult | null;
  params: CheckParams;
  context: AutumnContextParams;
}) => {
  let open = result?.allowed === false && params.dialog && context;

  if (!open) return;

  const isInRenderCycle = (() => {
    const stack = new Error().stack || "";
    return (
      stack.includes("renderWithHooks") ||
      stack.includes("updateFunctionComponent") ||
      stack.includes("beginWork") ||
      stack.includes("performUnitOfWork") ||
      stack.includes("workLoop") ||
      stack.includes("Component.render") ||
      stack.includes("FunctionComponent")
    );
  })();

  if (isInRenderCycle) {
    context.paywallRef.current = {
      component: params.dialog,
      open: true,
      props: params,
    };
  } else {
    context.paywallDialog.setComponent(params.dialog);
    context.paywallDialog.setProps(params);
    context.paywallDialog.setOpen(true);
  }
};

export const handleCheck = ({
  customer,
  isEntity,
  params,
  context,
}: {
  customer: Customer | Entity | null;
  isEntity?: boolean;
  params: CheckParams;
  context?: AutumnContextParams;
}): {
  data: CheckResult;
  error: null;
} => {

  if (!customer) {
    return {
      data: {
        allowed: false,
        feature_id: "",
        customer_id: "",
        required_balance: 0,
      } as CheckResult,
      error: null,
    };
  }

  if (!params.featureId && !params.productId) {
    throw new Error("allowed() requires either featureId or productId");
  }

  let result;
  
  if (params.featureId)
    result = handleFeatureCheck({ customer, params, isEntity });

  if (params.productId)
    result = handleProductCheck({ customer, params, isEntity });

  return {
    data: result as CheckResult,
    error: null,
  };
};
