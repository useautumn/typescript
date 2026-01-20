import type { Autumn } from "../client";
import type { AutumnPromise } from "../response";
import { staticWrapper } from "../utils";
import type {
	CreateBalanceParams,
	CreateBalanceResponse,
} from "./balancesTypes";

export const balanceMethods = (instance?: Autumn) => {
	return {
		create: (params: CreateBalanceParams) =>
			staticWrapper(handleCreateBalance, instance, { params }),
	};
};

const handleCreateBalance = async ({
	instance,
	params,
}: {
	instance: Autumn;
	params: CreateBalanceParams;
}): AutumnPromise<CreateBalanceResponse> => {
	return instance.post("/balances", params);
};
