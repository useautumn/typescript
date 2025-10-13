import type { Autumn } from "@useautumn/sdk";
import type {
	BillingPortalArgsType,
	CreateCustomerArgsType,
	GetCustomerArgsType,
	IdentifierOptsType,
	UpdateBalancesArgsType,
	UpdateCustomerArgsType,
} from "../../types.js";
import { toSnakeCase } from "../../utils.js";
import { wrapSdkCall } from "./utils.js";

export const get = async ({
	autumn,
	identifierOpts,
	args,
}: {
	autumn: Autumn;
	identifierOpts: IdentifierOptsType;
	args?: GetCustomerArgsType;
}) => {
	return await wrapSdkCall(() =>
		autumn.customers.get(identifierOpts.customerId, {
			expand: args?.expand,
		}),
	);
};

export const create = async ({
	autumn,
	identifierOpts,
	args,
	useArgs = true,
}: {
	autumn: Autumn;
	identifierOpts?: IdentifierOptsType;
	args: CreateCustomerArgsType;
	useArgs?: boolean;
}) => {
	return await wrapSdkCall(() =>
		autumn.customers.create({
			...(useArgs
				? {
						id: identifierOpts?.customerId,
						name: identifierOpts?.customerData?.name,
						email: identifierOpts?.customerData?.email,
					}
				: {
						id: args.id,
						name: args.name,
						email: args.email,
					}),
			...args,
		}),
	);
};

export const update = async ({
	autumn,
	identifierOpts,
	args,
}: {
	autumn: Autumn;
	identifierOpts: IdentifierOptsType;
	args: UpdateCustomerArgsType;
}) => {
	return await wrapSdkCall(() =>
		autumn.customers.update(
			identifierOpts.customerId,
			toSnakeCase({ obj: args }),
		),
	);
};

export const discard = async ({
	autumn,
	identifierOpts,
}: {
	autumn: Autumn;
	identifierOpts: IdentifierOptsType;
}) => {
	return await wrapSdkCall(() =>
		autumn.customers.delete(identifierOpts.customerId),
	);
};

export const updateBalances = async ({
	autumn,
	identifierOpts,
	args,
}: {
	autumn: Autumn;
	identifierOpts: IdentifierOptsType;
	args: UpdateBalancesArgsType;
}) => {
	return await wrapSdkCall(() =>
		autumn.customers.updateBalances(
			identifierOpts.customerId,
			toSnakeCase({ obj: args }),
		),
	);
};

export const billingPortal = async ({
	autumn,
	identifierOpts,
	args,
}: {
	autumn: Autumn;
	identifierOpts: IdentifierOptsType;
	args: BillingPortalArgsType;
}) => {
	return await wrapSdkCall(() =>
		autumn.billingPortal({
			customer_id: identifierOpts.customerId,
			return_url: args.returnUrl,
		}),
	);
};
