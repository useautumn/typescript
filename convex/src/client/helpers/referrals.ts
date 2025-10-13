import type { Autumn } from "@useautumn/sdk";
import type {
	CreateReferralCodeArgsType,
	IdentifierOptsType,
	RedeemReferralCodeArgsType,
} from "../../types.js";
import { wrapSdkCall } from "./utils.js";

export const createCode = async ({
	autumn,
	identifierOpts,
	args,
}: {
	autumn: Autumn;
	identifierOpts: IdentifierOptsType;
	args: CreateReferralCodeArgsType;
}) => {
	return await wrapSdkCall(() =>
		autumn.referrals.createCode({
			customer_id: identifierOpts.customerId,
			program_id: args.programId,
		}),
	);
};

export const redeemCode = async ({
	autumn,
	identifierOpts,
	args,
}: {
	autumn: Autumn;
	identifierOpts: IdentifierOptsType;
	args: RedeemReferralCodeArgsType;
}) => {
	return await wrapSdkCall(() =>
		autumn.referrals.redeemCode({
			customer_id: identifierOpts.customerId,
			code: args.code,
		}),
	);
};
