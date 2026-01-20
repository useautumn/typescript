import { AutumnContextParams } from "@/AutumnContext";
import { CheckParams } from "@/client/types/clientGenTypes";
import type { Customer, Entity, CheckResponse, CustomerBalances } from "@/types";
import type { Result } from "../../../../sdk/response";

export interface AllowedParams {
  featureId?: string;
  productId?: string;
  requiredBalance?: number;
}

const getCustomerBalance = ({
  customer,
  featureId,
  requiredBalance = 1,
}: {
  customer: Customer | Entity;
  featureId: string;
  requiredBalance?: number;
}) => {
  // V2: Access balances instead of features
  const balances = customer.balances;
  if (!balances) {
    return {
      balance: undefined,
      requiredBalance: requiredBalance,
    };
  }

  // 1. If there's a balance and current_balance >= requiredBalance, use it...
  let balance = balances[featureId];
  if (
    balance &&
    typeof balance.current_balance === "number" &&
    balance.current_balance >= requiredBalance
  ) {
    return {
      balance,
      requiredBalance: requiredBalance,
    };
  }

  // Check for credit system - look for features with credit_schema
  let creditSystemBalance = Object.values(balances).find(
    (b: CustomerBalances) =>
      b.feature?.credit_schema && b.feature.credit_schema.some((c) => c.metered_feature_id === featureId)
  );

  // 2. If there's a credit schema, use it...
  if (creditSystemBalance && creditSystemBalance.feature?.credit_schema) {
    let schemaItem = creditSystemBalance.feature.credit_schema.find(
      (c) => c.metered_feature_id === featureId
    );

    if (schemaItem) {
      return {
        balance: creditSystemBalance,
        requiredBalance: schemaItem.credit_cost * requiredBalance,
      };
    }
  }

  // 3. If no credit system exists, use the feature balance
  return {
    balance: balances[featureId],
    requiredBalance: requiredBalance,
  };
};

const getFeatureAllowed = ({
  balance,
  requiredBalance,
}: {
  balance: CustomerBalances | undefined;
  requiredBalance: number;
}) => {
  if (!balance) return false;
  // V2: Check feature type from balance.feature
  if (balance.feature?.type === "boolean") return true;
  if (balance.unlimited || balance.overage_allowed) return true;
  // V2: Use current_balance instead of balance
  return (balance.current_balance || 0) >= requiredBalance;
};

const handleFeatureCheck = ({
  customer,
  isEntity,
  params,
}: {
  customer: Customer | Entity;
  isEntity?: boolean;
  params: AllowedParams;
}): CheckResponse => {
  // 1. Get balance to use (V2 uses balances instead of features)
  let { balance, requiredBalance } = getCustomerBalance({
    customer,
    featureId: params.featureId!,
    ...(params.requiredBalance
      ? { requiredBalance: params.requiredBalance }
      : {}),
  });

  let allowed = getFeatureAllowed({
    balance,
    requiredBalance: requiredBalance ?? 1,
  });

  let result: CheckResponse = {
    allowed,
    customer_id: isEntity ? (customer as Entity).customer_id || "" : customer.id || "",
    balance: balance || null,
    required_balance: requiredBalance,
  };

  if (isEntity) {
    result.entity_id = (customer as Entity).id;
  }

  return result;
};

const handlePlanCheck = ({
  customer,
  isEntity,
  params,
}: {
  customer: Customer | Entity;
  isEntity?: boolean;
  params: AllowedParams;
}): CheckResponse => {
  // V2: Use subscriptions instead of products
  let subscription = customer.subscriptions?.find((s) => s.plan_id === params.productId);
  let allowed = subscription?.status === "active";

  let result: CheckResponse = {
    allowed,
    customer_id: isEntity ? (customer as Entity).customer_id || "" : customer.id || "",
    balance: null,
  };

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
  result: CheckResponse | null;
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
  data: CheckResponse;
  error: null;
} => {
  if (!customer) {
    return {
      data: {
        allowed: false,
        customer_id: "",
        balance: null,
      } as CheckResponse,
      error: null,
    };
  }

  if (!params.featureId && !params.productId) {
    throw new Error("allowed() requires either featureId or productId");
  }

  let result: CheckResponse;

  if (params.featureId) {
    result = handleFeatureCheck({ customer, params, isEntity });
  } else {
    result = handlePlanCheck({ customer, params, isEntity });
  }

  return {
    data: result,
    error: null,
  };
};
