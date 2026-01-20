import { AutumnContext } from "../../../libraries/react/AutumnContext";
import {
	type UseCustomerParams,
	type UseCustomerResult,
	useCustomerBase,
} from "../../../libraries/react/hooks/useCustomerBase";
import type { CustomerExpandOption } from "../../../libraries/react/types";

export const useCustomer = <
	const T extends readonly CustomerExpandOption[] = readonly [],
>(
	params?: UseCustomerParams<T>,
): UseCustomerResult<T> => {
	return useCustomerBase({
		params,
		AutumnContext: AutumnContext,
	});
};
