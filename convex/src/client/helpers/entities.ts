import type { Autumn } from "@useautumn/sdk";
import type {
	CreateEntityArgsType,
	GetEntityArgsType,
	IdentifierOptsType,
} from "../../types.js";
import { toSnakeCase } from "../../utils.js";
import { wrapSdkCall } from "./utils.js";

export const create = async ({
	autumn,
	identifierOpts,
	args,
}: {
	autumn: Autumn;
	identifierOpts: IdentifierOptsType;
	args: CreateEntityArgsType;
}) => {
	return await wrapSdkCall(() =>
		autumn.entities.create(
			identifierOpts.customerId,
			toSnakeCase({ obj: args }) as any,
		),
	);
};

export const discard = async ({
	autumn,
	identifierOpts,
	entityId,
}: {
	autumn: Autumn;
	identifierOpts: IdentifierOptsType;
	entityId: string;
}) => {
	return await wrapSdkCall(() =>
		autumn.entities.delete(entityId, {
			customer_id: identifierOpts.customerId,
		}),
	);
};

export const get = async ({
	autumn,
	identifierOpts,
	args,
}: {
	autumn: Autumn;
	identifierOpts: IdentifierOptsType;
	args: GetEntityArgsType & { entityId: string };
}) => {
	return await wrapSdkCall(() =>
		autumn.entities.get(args.entityId, {
			customer_id: identifierOpts.customerId,
			expand: args.expand,
		} as any),
	);
};
