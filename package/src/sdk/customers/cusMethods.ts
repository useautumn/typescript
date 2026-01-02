import type { Autumn } from "../client";
import { AutumnError } from "../error";
import type { AutumnPromise } from "../response";
import { buildPathWithQuery, staticWrapper } from "../utils";
import type {
	BillingPortalParams,
	BillingPortalResult,
	CreateCustomerParams,
	Customer,
	DeleteCustomerParams,
	GetCustomerParams,
	ListCustomersParams,
	UpdateBalancesParams,
	UpdateBalancesResult,
	UpdateCustomerParams,
} from "./cusTypes";

export const customerMethods = (instance?: Autumn) => {
	return {
		list: (params?: ListCustomersParams) =>
			staticWrapper(listCustomers, instance, { params }),
		get: (id: string, params?: GetCustomerParams) =>
			staticWrapper(getCustomer, instance, { id, params }),
		create: (params?: CreateCustomerParams) =>
			staticWrapper(createCustomer, instance, { params }),
		update: (id: string, params: UpdateCustomerParams) =>
			staticWrapper(updateCustomer, instance, { id, params }),

		delete: (id: string, params?: DeleteCustomerParams) =>
			staticWrapper(deleteCustomer, instance, { id, params }),

		billingPortal: (id: string, params?: BillingPortalParams) =>
			staticWrapper(billingPortal, instance, { id, params }),

		updateBalances: (id: string, params: UpdateBalancesParams) =>
			staticWrapper(updateBalances, instance, { id, params }),
	};
};

export const getExpandStr = (expand?: string[]) => {
	if (!expand) {
		return "";
	}
	return `expand=${expand.join(",")}`;
};

export const listCustomers = async ({
	instance,
	params,
}: {
	instance: Autumn;
	params?: ListCustomersParams;
}): AutumnPromise<{
	list: Customer[];
	total: number;
	limit: number;
	offset: number;
}> => {
	return instance.post("/customers/list", params ?? {});
};

export const getCustomer = async ({
	instance,
	id,
	params,
}: {
	instance: Autumn;
	id: string;
	params?: GetCustomerParams;
}): AutumnPromise<Customer> => {
	if (!id) {
		return {
			data: null,
			error: new AutumnError({
				message: "Customer ID is required",
				code: "CUSTOMER_ID_REQUIRED",
			}),
		};
	}

	return instance.get(`/customers/${id}?${getExpandStr(params?.expand)}`);
};

export const createCustomer = async ({
	instance,
	params,
}: {
	instance: Autumn;
	params?: CreateCustomerParams;
}): AutumnPromise<Customer> => {
	return instance.post(`/customers?${getExpandStr(params?.expand)}`, params);
};

export const updateCustomer = async ({
	instance,
	id,
	params,
}: {
	instance: Autumn;
	id: string;
	params: UpdateCustomerParams;
}): AutumnPromise<Customer> => {
	return instance.post(`/customers/${id}`, params);
};

export const deleteCustomer = async ({
	instance,
	id,
	params,
}: {
	instance: Autumn;
	id: string;
	params?: DeleteCustomerParams;
}): AutumnPromise<Customer> => {
	return instance.delete(
		`/customers/${id}${params?.delete_in_stripe ? "?delete_in_stripe=true" : ""}`,
	);
};

export const billingPortal = async ({
	instance,
	id,
	params,
}: {
	instance: Autumn;
	id: string;
	params?: BillingPortalParams;
}): AutumnPromise<BillingPortalResult> => {
	const finalParams = {
		...params,
		return_url: params?.return_url ?? instance.defaultReturnUrl,
	};
	return instance.post(`/customers/${id}/billing_portal`, finalParams);
};

export const updateBalances = async ({
	instance,
	id,
	params,
}: {
	instance: Autumn;
	id: string;
	params: UpdateBalancesParams;
}): AutumnPromise<UpdateBalancesResult> => {
	return instance.post(`/customers/${id}/balances`, {
		balances: Array.isArray(params) ? params : [params],
	});
};
