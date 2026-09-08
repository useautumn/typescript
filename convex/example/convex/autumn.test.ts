// @vitest-environment node
import { describe, expect, test, vi } from "vitest";

type ExampleIdentity = {
  subject: string;
  tokenIdentifier: string;
  name: string;
  email: string;
  role?: string;
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
    portal: ReturnType<typeof vi.fn>;
    trackReference: symbol;
  } => ({
    constructorOptions: undefined,
    portal: vi.fn(async () => ({
      customerId: "customer-1",
      url: "https://portal.example/session",
    })),
    trackReference: Symbol("internal.autumn.track"),
  })
);

vi.mock("@useautumn/convex", () => ({
  Autumn: class {
    constructor(_component: unknown, options: AutumnOptions) {
      autumnMock.constructorOptions = options;
    }

    billing = { portal: autumnMock.portal };

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

type ExamplePortalAction = {
  _handler: (
    ctx: {
      auth: {
        getUserIdentity: () => Promise<{ role?: string } | null>;
      };
    },
    args: Record<string, never>
  ) => Promise<string>;
};

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

describe("billing portal example", () => {
  test("authorizes billing and constructs the return URL on the server", async () => {
    const { openBillingPortal } = await import("./autumn.js");
    const action = openBillingPortal as unknown as ExamplePortalAction;
    const ctx = {
      auth: {
        getUserIdentity: async () => ({ role: "billing_admin" }),
      },
    };
    autumnMock.portal.mockClear();

    await expect(action._handler(ctx, {})).resolves.toBe(
      "https://portal.example/session"
    );
    expect(autumnMock.portal).toHaveBeenCalledOnce();
    expect(autumnMock.portal).toHaveBeenCalledWith(ctx, {
      returnUrl: "https://app.example.com/settings/billing",
    });
  });

  test.each([
    ["anonymous", null, "Sign in to manage billing."],
    [
      "unauthorized",
      { role: "member" },
      "You are not allowed to manage billing.",
    ],
  ])(
    "rejects an %s caller before portal creation",
    async (_name, identity, message) => {
      const { openBillingPortal } = await import("./autumn.js");
      const action = openBillingPortal as unknown as ExamplePortalAction;
      autumnMock.portal.mockClear();

      await expect(
        action._handler({ auth: { getUserIdentity: async () => identity } }, {})
      ).rejects.toThrow(message);
      expect(autumnMock.portal).not.toHaveBeenCalled();
    }
  );
});

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
