// @vitest-environment node
import { describe, expect, test, vi } from "vitest";

vi.mock("@useautumn/convex", () => ({
  Autumn: class {
    api(): Record<string, never> {
      return {};
    }

    internalApi(): Record<string, never> {
      return {};
    }
  },
}));

type ExampleMutation = {
  _handler: (
    ctx: {
      auth: { getUserIdentity: () => Promise<{ subject: string }> };
      db: { insert: (table: string, value: unknown) => Promise<string> };
      scheduler: {
        runAfter: (
          delay: number,
          reference: unknown,
          args: unknown
        ) => Promise<void>;
      };
    },
    args: { count: number }
  ) => Promise<unknown>;
};

describe("scheduled usage example", () => {
  test("rejects a negative count before writing or scheduling", async () => {
    const { recordMessages } = await import("./autumn.js");
    const insert = vi.fn(async () => "messages:example-id");
    const runAfter = vi.fn(async () => undefined);
    const mutation = recordMessages as unknown as ExampleMutation;

    await expect(
      mutation._handler(
        {
          auth: {
            getUserIdentity: async () => ({ subject: "customer-1" }),
          },
          db: { insert },
          scheduler: { runAfter },
        },
        { count: -1 }
      )
    ).rejects.toThrow("Message count cannot be negative.");

    expect(insert).not.toHaveBeenCalled();
    expect(runAfter).not.toHaveBeenCalled();
  });
});
