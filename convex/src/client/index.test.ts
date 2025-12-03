import { afterEach, beforeEach, describe, test, vi } from "vitest";
import { Autumn } from "./index.js";
import { defineSchema } from "convex/server";
import { components, initConvexTest } from "./setup.test.js";

// The schema for the tests
const schema = defineSchema({});


describe("Autumn client", () => {
  beforeEach(async () => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });
  test("should make thick client", async () => {
	const autumn = new Autumn(components.autumn, {
	  identify: async () => ({
	    customerId: "test-customer",
	    customerData: {
	      name: "Test User",
	      email: "test@example.com",
	    },
	  }),
	  secretKey: "test-api-key",
	});
    const t = initConvexTest(schema);
	await t.run(async (ctx) => {
		await autumn.products.list(ctx);
	});
  });
});
