// @vitest-environment node
import { describe, expect, test, vi } from "vitest";

type ExampleIdentity = {
  subject: string;
  tokenIdentifier: string;
  name: string;
  email: string;
};

type AutumnOptions = {
  identify: (ctx: {
    auth: { getUserIdentity: () => Promise<ExampleIdentity | null> };
  }) => Promise<{
    customerId: string;
    customerData: { name: string; email: string };
  } | null>;
};

const autumnMock = vi.hoisted(
  (): {
    constructorOptions: AutumnOptions | undefined;
    trackReference: symbol;
  } => ({
    constructorOptions: undefined,
    trackReference: Symbol("internal.autumn.track"),
  })
);

vi.mock("@useautumn/convex", () => ({
  Autumn: class {
    constructor(_component: unknown, options: AutumnOptions) {
      autumnMock.constructorOptions = options;
    }

    api(): Record<string, never> {
      return {};
    }

    internalApi(): Record<string, never> {
      return {};
    }
  },
}));

vi.mock("./_generated/api.js", () => ({
  components: { autumn: {} },
  internal: { autumn: { track: autumnMock.trackReference } },
}));

type ExampleMutation = {
  _handler: (
    ctx: {
      auth: { getUserIdentity: () => Promise<{ subject: string } | null> };
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
  test("uses the token identifier for customer identity and usage", async () => {
    const { recordMessages } = await import("./autumn.js");
    const identity = {
      subject: "shared-subject",
      tokenIdentifier: "https://issuer.example|shared-subject",
      name: "Ada Lovelace",
      email: "ada@example.com",
    };
    const options = autumnMock.constructorOptions;
    if (!options)
      throw new Error("Autumn constructor options were not captured.");

    await expect(
      options.identify({
        auth: { getUserIdentity: async () => identity },
      })
    ).resolves.toEqual({
      customerId: identity.tokenIdentifier,
      customerData: {
        name: identity.name,
        email: identity.email,
      },
    });

    const messageId = "messages:example-id";
    const insert = vi.fn(async () => messageId);
    const runAfter = vi.fn(async () => undefined);
    const mutation = recordMessages as unknown as ExampleMutation;

    await expect(
      mutation._handler(
        {
          auth: {
            getUserIdentity: async () => identity,
          },
          db: { insert },
          scheduler: { runAfter },
        },
        { count: 3 }
      )
    ).resolves.toBeNull();

    expect(insert).toHaveBeenCalledTimes(1);
    expect(insert).toHaveBeenCalledWith("messages", { count: 3 });
    expect(runAfter).toHaveBeenCalledTimes(1);
    expect(runAfter).toHaveBeenCalledWith(0, autumnMock.trackReference, {
      customerId: identity.tokenIdentifier,
      featureId: "messages",
      value: 3,
      operationId: messageId,
    });
  });

  test("returns no Autumn identity for an anonymous caller", async () => {
    await import("./autumn.js");
    const options = autumnMock.constructorOptions;
    if (!options)
      throw new Error("Autumn constructor options were not captured.");

    await expect(
      options.identify({
        auth: { getUserIdentity: async () => null },
      })
    ).resolves.toBeNull();
  });

  test("rejects an anonymous caller before writing or scheduling", async () => {
    const { recordMessages } = await import("./autumn.js");
    const insert = vi.fn(async () => "messages:example-id");
    const runAfter = vi.fn(async () => undefined);
    const mutation = recordMessages as unknown as ExampleMutation;

    await expect(
      mutation._handler(
        {
          auth: { getUserIdentity: async () => null },
          db: { insert },
          scheduler: { runAfter },
        },
        { count: 3 }
      )
    ).rejects.toThrow(/^Sign in to record messages\.$/);

    expect(insert).not.toHaveBeenCalled();
    expect(runAfter).not.toHaveBeenCalled();
  });

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
