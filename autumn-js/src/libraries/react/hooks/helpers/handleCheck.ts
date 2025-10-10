import type Autumn from "@sdk";
import type { AutumnContextParams } from "@/AutumnContext";
import type { CheckParams } from "@/clientTypes";
// import {
//   CheckFeatureResult,
//   CheckFeatureResultSchema,
//   CheckProductResult,
//   CheckResult,
//   Customer,
//   CustomerFeature,
//   Entity
// } from "@sdk";

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
	customer: Autumn.Customer | Autumn.Entity;
	featureId: string;
	requiredBalance?: number;
}) => {
	// 1. If there's a cusFeature and balance > requiredBalance, use it...
	const cusFeature = customer.features?.[featureId];
	if (
		cusFeature &&
		typeof cusFeature.balance === "number" &&
		cusFeature.balance >= requiredBalance
	) {
		return {
			cusFeature,
			requiredBalance: requiredBalance,
		};
	}

	// 1. If credit system exists, use it
	const creditSchema = Object.values(customer.features ?? {}).find(
		(f: Autumn.CustomerFeature) =>
			f.credit_schema &&
			f.credit_schema.some((c) => c.feature_id === featureId),
	);

	// 2. If there's a credit schema, use it...
	if (creditSchema) {
		const schemaItem = creditSchema.credit_schema?.find(
			(c) => c.feature_id === featureId,
		)!;

		return {
			cusFeature: creditSchema,
			requiredBalance: schemaItem.credit_amount * requiredBalance,
		};
	}

	// 2. If no credit system exists, use the feature
	return {
		cusFeature: customer.features?.[featureId],
		requiredBalance: requiredBalance,
	};
};

const getFeatureAllowed = ({
	cusFeature,
	requiredBalance,
}: {
	cusFeature: Autumn.CustomerFeature | undefined;
	requiredBalance: number;
}) => {
	if (!cusFeature) return false;
	if (cusFeature.type === "static") return true;
	if (cusFeature.unlimited || cusFeature.overage_allowed) return true;
	if (cusFeature.usage_limit) {
		const extraUsage =
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
	customer: Autumn.Customer | Autumn.Entity;
	isEntity?: boolean;
	params: AllowedParams;
}) => {
	// 1. Get feature to use...
	const { cusFeature, requiredBalance } = getCusFeature({
		customer,
		featureId: params.featureId!,
		...(params.requiredBalance
			? { requiredBalance: params.requiredBalance }
			: {}),
	});

	const allowed = getFeatureAllowed({
		cusFeature,
		requiredBalance: requiredBalance ?? 1,
	});

	const result = {
		allowed,
		feature_id: cusFeature?.id ?? params.featureId!,
		customer_id: isEntity
			? (customer as Autumn.Entity).customer_id
			: customer.id,
		required_balance: requiredBalance,
		code: "",
		...cusFeature,
	} as Autumn.CheckResponse;

	if (isEntity) {
		result.entity_id = (customer as Autumn.Entity).id;
	}

	try {
		return result;
	} catch (error) {
		return result;
	}
};

// const handleProductCheck = ({
//   customer,
//   isEntity,
//   params,
// }: {
//   customer: Autumn.Customer | Autumn.Entity;
//   isEntity?: boolean;
//   params: AllowedParams;
// }) => {
//   let product = customer.products.find((p) => p.id == params.productId);
//   let allowed = product?.status === "active";

//   let result = {
//     allowed,
//     customer_id: isEntity ? (customer as Autumn.Entity).customer_id : customer.id,
//     product_id: params.productId!,
//   } as CheckProductResult;
//   if (product) {
//     result.status = product.status;
//   }

//   if (isEntity) {
//     result.entity_id = (customer as Autumn.Entity).id;
//   }

//   return result;
// };

export const openDialog = ({
	result,
	params,
	context,
}: {
	result: Autumn.CheckResponse | null;
	params: CheckParams;
	context: AutumnContextParams;
}) => {
	const open = result?.allowed === false && params.dialog && context;

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
	customer: Autumn.Customer | Autumn.Entity | null;
	isEntity?: boolean;
	params: CheckParams;
	context?: AutumnContextParams;
}): Autumn.CheckResponse => {
	if (!customer) {
		return {
			allowed: false,
			feature_id: "",
			customer_id: "",
			required_balance: 0,
			code: "",
		} as Autumn.CheckResponse;
	}

	if (!params.featureId && !params.productId) {
		throw new Error("allowed() requires either featureId or productId");
	}

	return handleFeatureCheck({ customer, params, isEntity });
};
