import type {
	ActionBuilder,
	ApiFromModules,
	DataModelFromSchemaDefinition,
	MutationBuilder,
	QueryBuilder,
} from "convex/server";
import {
	actionGeneric,
	anyApi,
	defineSchema,
	mutationGeneric,
	queryGeneric,
} from "convex/server";
import { v } from "convex/values";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { Autumn } from "./index.js";
import { components, initConvexTest } from "./setup.test.js";

// The schema for the tests
const schema = defineSchema({});
type DataModel = DataModelFromSchemaDefinition<typeof schema>;
// type DatabaseReader = GenericDatabaseReader<DataModel>;
const query = queryGeneric as QueryBuilder<DataModel, "public">;
const mutation = mutationGeneric as MutationBuilder<DataModel, "public">;
const action = actionGeneric as ActionBuilder<DataModel, "public">;

const autumn = new Autumn(components.autumn, {
	identify: async (ctx) => ({
		customerId: "test-customer",
		customerData: {
			name: "Test User",
			email: "test@example.com",
		},
	}),
	apiKey: "test-api-key",
});

export const testQuery = query({
	args: { name: v.string() },
	handler: async (ctx, args) => {
		return await autumn.count(ctx, args.name);
	},
});

export const testMutation = mutation({
	args: { name: v.string(), count: v.number() },
	handler: async (ctx, args) => {
		return await autumn.add(ctx, args.name, args.count);
	},
});

export const testAction = action({
	args: { name: v.string(), count: v.number() },
	handler: async (ctx, args) => {
		return await autumn.add(ctx, args.name, args.count);
	},
});

const testApi: ApiFromModules<{
	fns: {
		testQuery: typeof testQuery;
		testMutation: typeof testMutation;
		testAction: typeof testAction;
	};
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
}>["fns"] = anyApi["index.test"] as any;

describe("Autumn thick client", () => {
	beforeEach(async () => {
		vi.useFakeTimers();
	});
	afterEach(() => {
		vi.useRealTimers();
	});
	test("should make thick client", async () => {
		const c = new Autumn(components.autumn, {
			identify: async (ctx) => ({
				customerId: "test-customer",
				customerData: {
					name: "Test User",
					email: "test@example.com",
				},
			}),
			apiKey: "test-api-key",
		});
		const t = initConvexTest(schema);
		await t.run(async (ctx) => {
			await c.add(ctx, "beans", 1);
			expect(await c.count(ctx, "beans")).toBe(1);
		});
	});
	test("should work from a test function", async () => {
		const t = initConvexTest(schema);
		const result = await t.mutation(testApi.testMutation, {
			name: "beans",
			count: 1,
		});
		expect(result).toBe(null);
	});
});
