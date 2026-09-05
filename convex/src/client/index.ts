import { ConvexError } from "convex/values";
import { actionGeneric, internalActionGeneric } from "convex/server";
import type { Autumn as AutumnSDK } from "autumn-js";
import type { ComponentApi } from "../component/_generated/component.js";
import {
  AggregateEventsArgs,
  type AggregateEventsArgs as AggregateEventsArgsType,
  type AttachArgs as AttachArgsType,
  type BillingPortalArgs as BillingPortalArgsType,
  CheckArgs,
  type CheckArgs as CheckArgsType,
  type ConsumeCheckArgs as ConsumeCheckArgsType,
  type CreateEntityArgs as CreateEntityArgsType,
  type CreateReferralCodeArgs as CreateReferralCodeArgsType,
  type DeleteCustomerArgs as DeleteCustomerArgsType,
  type DeleteEntityArgs as DeleteEntityArgsType,
  GetCustomerArgs,
  type GetCustomerArgs as GetCustomerArgsType,
  GetEntityArgs,
  type GetEntityArgs as GetEntityArgsType,
  type GetOrCreateCustomerArgs as GetOrCreateCustomerArgsType,
  GetPlanArgs,
  type GetPlanArgs as GetPlanArgsType,
  type Identifier,
  InternalAttachArgs,
  InternalConsumeCheckArgs,
  InternalCreateEntityArgs,
  InternalCreateReferralCodeArgs,
  InternalDeleteCustomerArgs,
  InternalDeleteEntityArgs,
  InternalGetOrCreateCustomerArgs,
  InternalMultiAttachArgs,
  InternalMultiUpdateArgs,
  InternalRedeemReferralCodeArgs,
  InternalSetupPaymentArgs,
  InternalTrackArgs,
  InternalUpdateBalanceArgs,
  InternalUpdateCustomerArgs,
  InternalUpdateEntityArgs,
  InternalUpdateSubscriptionArgs,
  ListEntitiesArgs,
  type ListEntitiesArgs as ListEntitiesArgsType,
  ListEventsArgs,
  type ListEventsArgs as ListEventsArgsType,
  ListPlansArgs,
  type ListPlansArgs as ListPlansArgsType,
  type MultiAttachArgs as MultiAttachArgsType,
  type MultiUpdateArgs as MultiUpdateArgsType,
  PublicBillingPortalArgs,
  PublicPreviewAttachArgs,
  type PreviewAttachArgs as PreviewAttachArgsType,
  PublicPreviewMultiAttachArgs,
  type PreviewMultiAttachArgs as PreviewMultiAttachArgsType,
  PublicPreviewMultiUpdateArgs,
  PublicPreviewUpdateArgs,
  type PreviewMultiUpdateArgs as PreviewMultiUpdateArgsType,
  type PreviewUpdateArgs as PreviewUpdateArgsType,
  type RedeemReferralCodeArgs as RedeemReferralCodeArgsType,
  type SetupPaymentArgs as SetupPaymentArgsType,
  type TrackArgs as TrackArgsType,
  type UpdateBalanceArgs as UpdateBalanceArgsType,
  type UpdateCustomerArgs as UpdateCustomerArgsType,
  type UpdateEntityArgs as UpdateEntityArgsType,
  type UpdateSubscriptionArgs as UpdateSubscriptionArgsType,
} from "../types.js";
import {
  AutumnConfigurationError,
  type AutumnErrorData,
  AutumnIndeterminateError,
  AutumnValidationError,
} from "../errors.js";
import {
  deriveProviderKey,
  validateOperationNamespace,
} from "../idempotency.js";
import {
  AutumnSerializationError,
  toConvexSerializable,
} from "../serialization.js";
import {
  type AutumnCall,
  AutumnTransport,
  type AutumnTransportOptions,
  invokeNative,
  isRequestRejectedLocally,
  isTransportIndeterminate,
  sdkStatus,
} from "../transport.js";

export type AutumnComponent = ComponentApi;
export type AutumnOptions<Context> = AutumnTransportOptions & {
  /**
   * The Autumn organization and environment this client operates on.
   *
   * Provider idempotency keys are derived from it, so two clients that share
   * one component instance never address each other's operations at Autumn.
   * Choose a deliberate, stable value such as `"acme-production"`: it has to
   * survive a secret-key rotation, because a value derived from the key would
   * change the key of every operation still inside Autumn's duplicate window.
   */
  operationNamespace: string;
  identify: (ctx: Context) => Identifier | null | Promise<Identifier | null>;
};

type NativeCall<T> = (
  sdk: AutumnSDK,
  options: { retries: { strategy: "none" }; headers?: Record<string, string> }
) => Promise<T>;
type MutationArgs = { operationId: string };
type InternalMutationArgs = MutationArgs & { customerId: string };

function withoutOperationId<T extends MutationArgs>(
  args: T
): Omit<T, "operationId"> {
  const { operationId: _operationId, ...request } = args;
  return request;
}

/**
 * Drop the fields that identify the operation rather than describe the request.
 *
 * An internal action carries the customer ID that its trusted caller resolved.
 * It and the operation ID are action metadata, so both are stripped before the
 * Autumn request is built and the customer is re-added from the trusted
 * identifier.
 */
function withoutIdentity<T extends InternalMutationArgs>(
  args: T
): Omit<T, "operationId" | "customerId"> {
  const {
    operationId: _operationId,
    customerId: _customerId,
    ...request
  } = args;
  return request;
}

function requireCondition(
  operation: string,
  condition: boolean,
  message: string
): asserts condition {
  if (!condition) throw new AutumnValidationError(operation, message);
}

function validateTrack(args: TrackArgsType): void {
  requireCondition(
    "track",
    (args.featureId === undefined) !== (args.eventName === undefined),
    "track requires exactly one of featureId or eventName."
  );
}

function validateFeatureQuantities(
  operation: string,
  quantities: Array<{ featureId: string }> | undefined
): void {
  if (!quantities) return;
  const featureIds = new Set(quantities.map(({ featureId }) => featureId));
  requireCondition(
    operation,
    featureIds.size === quantities.length,
    `${operation} featureQuantities must contain each featureId at most once.`
  );
}

function validateAttach(operation: string, args: PreviewAttachArgsType): void {
  validateFeatureQuantities(operation, args.featureQuantities);
}

function validateMultiAttach(
  operation: string,
  args: PreviewMultiAttachArgsType
): void {
  requireCondition(
    operation,
    args.plans.length > 0,
    `${operation} requires plans.`
  );
  for (const plan of args.plans) {
    validateFeatureQuantities(operation, plan.featureQuantities);
  }
}

function validateMultiUpdate(
  operation: string,
  args: PreviewMultiUpdateArgsType
): void {
  requireCondition(
    operation,
    args.updates.length > 0,
    `${operation} requires updates.`
  );
  for (const update of args.updates) {
    requireCondition(
      operation,
      update.planId !== undefined || update.subscriptionId !== undefined,
      `${operation} updates require planId or subscriptionId.`
    );
  }
}

function validateBalance(args: UpdateBalanceArgsType): void {
  const changes = [args.remaining, args.addToBalance, args.usage].filter(
    (value) => value !== undefined
  );
  requireCondition(
    "balances.update",
    changes.length <= 1,
    "balances.update accepts at most one of remaining, addToBalance or usage."
  );
}

function validateAggregateEvents(args: AggregateEventsArgsType): void {
  requireCondition(
    "events.aggregate",
    (args.range === undefined) !== (args.customRange === undefined),
    "events.aggregate requires exactly one of range or customRange."
  );
  if (args.customRange) {
    requireCondition(
      "events.aggregate",
      args.customRange.start <= args.customRange.end,
      "events.aggregate customRange start must not exceed end."
    );
  }
  if (args.filterBy) {
    requireCondition(
      "events.aggregate",
      Object.keys(args.filterBy).length <= 5,
      "events.aggregate accepts at most five filters."
    );
  }
}

function validateListEvents(args: ListEventsArgsType): void {
  if (
    args.customRange?.start !== undefined &&
    args.customRange.end !== undefined
  ) {
    requireCondition(
      "events.list",
      args.customRange.start <= args.customRange.end,
      "events.list customRange start must not exceed end."
    );
  }
}

function readOnlyCheckRequest(
  identifier: Identifier,
  args: CheckArgsType
): CheckArgsType & { customerId: string } {
  return {
    customerId: identifier.customerId,
    featureId: args.featureId,
    entityId: args.entityId,
    requiredBalance: args.requiredBalance,
    properties: args.properties,
    withPreview: args.withPreview,
  };
}

function mergeCustomerData(
  identifier: Identifier,
  request: Omit<GetOrCreateCustomerArgsType, "operationId">
): Omit<GetOrCreateCustomerArgsType, "operationId"> & { customerId: string } {
  return {
    ...identifier.customerData,
    ...request,
    customerId: identifier.customerId,
  };
}

function safeError(
  operation: string,
  error: unknown,
  statusCode?: number
): AutumnErrorData {
  if (error instanceof AutumnValidationError) {
    return {
      code: error.code,
      operation,
      message: error.message,
    };
  }
  if (error instanceof AutumnConfigurationError) {
    return {
      code: error.code,
      operation,
      message: error.message,
    };
  }
  if (error instanceof AutumnSerializationError) {
    return {
      code: "AUTUMN_RESULT_UNSERIALIZABLE",
      operation,
      message: error.message,
    };
  }
  // The SDK's own schema check rejected the request before any connection was
  // opened. The SDK's message embeds the offending value, so it is replaced
  // rather than passed through.
  if (isRequestRejectedLocally(error)) {
    return {
      code: "AUTUMN_VALIDATION_ERROR",
      operation,
      message: "The Autumn request was rejected before it was sent.",
    };
  }
  if (isTransportIndeterminate(error, statusCode)) {
    return {
      code: "AUTUMN_INDETERMINATE",
      operation,
      ...(statusCode === undefined ? {} : { statusCode }),
      message: "The Autumn operation has an indeterminate outcome.",
    };
  }
  return {
    code: "AUTUMN_REQUEST_FAILED",
    operation,
    ...(statusCode === undefined ? {} : { statusCode }),
    message: "Autumn rejected the request.",
  };
}

function convexActionError(operation: string, error: unknown) {
  if (error instanceof ConvexError) return error;
  return new ConvexError(safeError(operation, error, sdkStatus(error)));
}

export class Autumn<Context = unknown> {
  private readonly transport: AutumnTransport;

  /**
   * @param component The installed Autumn component. It holds no tables and no
   * functions: Autumn owns the state of every operation, and this package keeps
   * no copy of it.
   */
  constructor(
    public readonly component: AutumnComponent,
    public readonly options: AutumnOptions<Context>
  ) {
    validateOperationNamespace(options.operationNamespace);
    this.transport = new AutumnTransport(options);
  }

  private async identify(ctx: Context): Promise<Identifier> {
    const identifier = await this.options.identify(ctx);
    if (!identifier?.customerId) {
      throw new AutumnConfigurationError(
        "Autumn identify(ctx) must return a customerId."
      );
    }
    return identifier;
  }

  /**
   * The customer an internal action runs for.
   *
   * Scheduled work carries no original user auth, so an identity cannot be
   * derived here at all. The customer ID comes from the server code that invoked
   * the action and has already decided that the operation is allowed, which
   * holds whether or not that caller still had an identity of its own.
   */
  private trustedIdentifier(
    operation: string,
    args: InternalMutationArgs
  ): Identifier {
    requireCondition(
      operation,
      args.customerId.length > 0,
      `${operation} requires a customerId from its caller.`
    );
    return { customerId: args.customerId };
  }

  private async read<Request extends object, T>(
    ctx: Context,
    operation: string,
    request: (identifier: Identifier) => Request,
    invoke: (request: Request) => NativeCall<T>
  ): Promise<T> {
    const identifier = await this.identify(ctx);
    const nativeRequest = request(identifier);
    const call = this.transport.createCall();
    return await invokeNative(
      operation,
      call,
      nativeRequest,
      invoke(nativeRequest)
    );
  }

  /**
   * The single call a mutation is allowed to make.
   *
   * Its `Idempotency-Key` is the only duplicate suppression a mutation has, and
   * it belongs to Autumn: it is time-bounded, it rejects a repeat rather than
   * replaying the original result, and it therefore says nothing about an
   * outcome this package could not read. A mutation dispatches once for that
   * reason, and neither retries nor schedules a second attempt.
   *
   * The identifier is the trusted one the operation runs for, resolved before
   * the key is derived. Autumn scopes a claimed key to the organization and
   * environment, so the customer has to be inside the key for one customer's
   * operation ID to stop suppressing another customer's mutation.
   */
  private async keyedCall(
    operation: string,
    identifier: Identifier,
    args: MutationArgs
  ): Promise<AutumnCall> {
    return this.transport.createCall(
      await deriveProviderKey({
        operation,
        operationNamespace: this.options.operationNamespace,
        customerId: identifier.customerId,
        operationId: args.operationId,
      })
    );
  }

  private async mutate<Request extends object, T>(
    ctx: Context,
    operation: string,
    args: MutationArgs,
    request: (identifier: Identifier) => Request,
    invoke: (request: Request) => NativeCall<T>
  ): Promise<T> {
    const identifier = await this.identify(ctx);
    const nativeRequest = request(identifier);
    const call = await this.keyedCall(operation, identifier, args);
    return await invokeNative(
      operation,
      call,
      nativeRequest,
      invoke(nativeRequest)
    );
  }

  private async actionResult<T>(
    operation: string,
    execute: () => Promise<T>
  ): Promise<T> {
    try {
      return toConvexSerializable(await execute());
    } catch (error) {
      throw convexActionError(operation, error);
    }
  }

  /**
   * Run one provider mutation as an internal Convex action.
   *
   * The action is one shot. It sends the request once and reports what it saw;
   * an ambiguous outcome such as HTTP 202, HTTP 409, an HTTP 5xx, a timeout or a
   * dropped connection becomes an `AUTUMN_INDETERMINATE` error and stays there.
   * Deciding what to do about it needs the state Autumn holds, which is why
   * nothing here retries, schedules or records an attempt of its own.
   */
  private async generated<
    Args extends InternalMutationArgs,
    Request extends object,
    T,
  >(
    operation: string,
    args: Args,
    request: (identifier: Identifier) => Request,
    invoke: (request: Request) => NativeCall<T>,
    validate?: (args: Args) => void
  ): Promise<T> {
    try {
      validate?.(args);
      const identifier = this.trustedIdentifier(operation, args);
      const nativeRequest = request(identifier);
      const call = await this.keyedCall(operation, identifier, args);
      return toConvexSerializable(
        await invokeNative(
          operation,
          call,
          nativeRequest,
          invoke(nativeRequest)
        )
      );
    } catch (error) {
      throw convexActionError(operation, error);
    }
  }

  async check(ctx: Context, args: CheckArgsType) {
    return await this.read(
      ctx,
      "check",
      (identifier) => readOnlyCheckRequest(identifier, args),
      (request) => (sdk, options) => sdk.check(request, options)
    );
  }

  async consumeCheck(ctx: Context, args: ConsumeCheckArgsType) {
    return await this.mutate(
      ctx,
      "check",
      args,
      (identifier) => ({
        ...withoutOperationId(args),
        customerId: identifier.customerId,
        sendEvent: true as const,
      }),
      (request) => (sdk, options) => sdk.check(request, options)
    );
  }

  async track(ctx: Context, args: TrackArgsType) {
    validateTrack(args);
    return await this.mutate(
      ctx,
      "track",
      args,
      (identifier) => ({
        ...withoutOperationId(args),
        customerId: identifier.customerId,
      }),
      (request) => (sdk, options) => sdk.track(request, options)
    );
  }

  billing = {
    previewAttach: async (ctx: Context, args: PreviewAttachArgsType) => {
      validateAttach("billing.previewAttach", args);
      return await this.read(
        ctx,
        "billing.previewAttach",
        (identifier) => ({ ...args, customerId: identifier.customerId }),
        (request) => (sdk, options) =>
          sdk.billing.previewAttach(request, options)
      );
    },
    attach: async (ctx: Context, args: AttachArgsType) => {
      validateAttach("billing.attach", args);
      return await this.mutate(
        ctx,
        "billing.attach",
        args,
        (identifier) => ({
          ...withoutOperationId(args),
          customerId: identifier.customerId,
        }),
        (request) => (sdk, options) => sdk.billing.attach(request, options)
      );
    },
    previewMultiAttach: async (
      ctx: Context,
      args: PreviewMultiAttachArgsType
    ) => {
      validateMultiAttach("billing.previewMultiAttach", args);
      return await this.read(
        ctx,
        "billing.previewMultiAttach",
        (identifier) => ({ ...args, customerId: identifier.customerId }),
        (request) => (sdk, options) =>
          sdk.billing.previewMultiAttach(request, options)
      );
    },
    multiAttach: async (ctx: Context, args: MultiAttachArgsType) => {
      validateMultiAttach("billing.multiAttach", args);
      return await this.mutate(
        ctx,
        "billing.multiAttach",
        args,
        (identifier) => ({
          ...withoutOperationId(args),
          customerId: identifier.customerId,
        }),
        (request) => (sdk, options) => sdk.billing.multiAttach(request, options)
      );
    },
    previewUpdate: async (ctx: Context, args: PreviewUpdateArgsType) => {
      validateFeatureQuantities(
        "billing.previewUpdate",
        args.featureQuantities
      );
      return await this.read(
        ctx,
        "billing.previewUpdate",
        (identifier) => ({ ...args, customerId: identifier.customerId }),
        (request) => (sdk, options) =>
          sdk.billing.previewUpdate(request, options)
      );
    },
    update: async (ctx: Context, args: UpdateSubscriptionArgsType) => {
      validateFeatureQuantities("billing.update", args.featureQuantities);
      return await this.mutate(
        ctx,
        "billing.update",
        args,
        (identifier) => ({
          ...withoutOperationId(args),
          customerId: identifier.customerId,
        }),
        (request) => (sdk, options) => sdk.billing.update(request, options)
      );
    },
    previewMultiUpdate: async (
      ctx: Context,
      args: PreviewMultiUpdateArgsType
    ) => {
      validateMultiUpdate("billing.previewMultiUpdate", args);
      return await this.read(
        ctx,
        "billing.previewMultiUpdate",
        (identifier) => ({ ...args, customerId: identifier.customerId }),
        (request) => (sdk, options) =>
          sdk.billing.previewMultiUpdate(request, options)
      );
    },
    multiUpdate: async (ctx: Context, args: MultiUpdateArgsType) => {
      validateMultiUpdate("billing.multiUpdate", args);
      return await this.mutate(
        ctx,
        "billing.multiUpdate",
        args,
        (identifier) => ({
          ...withoutOperationId(args),
          customerId: identifier.customerId,
        }),
        (request) => (sdk, options) => sdk.billing.multiUpdate(request, options)
      );
    },
    setupPayment: async (ctx: Context, args: SetupPaymentArgsType) => {
      validateFeatureQuantities("billing.setupPayment", args.featureQuantities);
      return await this.mutate(
        ctx,
        "billing.setupPayment",
        args,
        (identifier) => ({
          ...withoutOperationId(args),
          customerId: identifier.customerId,
        }),
        (request) => (sdk, options) =>
          sdk.billing.setupPayment(request, options)
      );
    },
    portal: async (ctx: Context, args: BillingPortalArgsType = {}) =>
      await this.read(
        ctx,
        "billing.portal",
        (identifier) => ({ ...args, customerId: identifier.customerId }),
        (request) => (sdk, options) =>
          sdk.billing.openCustomerPortal(request, options)
      ),
  };

  customers = {
    get: async (ctx: Context, args: GetCustomerArgsType = {}) =>
      await this.read(
        ctx,
        "customers.get",
        (identifier) => ({ ...args, customerId: identifier.customerId }),
        (request) => (sdk, options) => sdk.customers.get(request, options)
      ),
    getOrCreate: async (ctx: Context, args: GetOrCreateCustomerArgsType) =>
      await this.mutate(
        ctx,
        "customers.getOrCreate",
        args,
        (identifier) => mergeCustomerData(identifier, withoutOperationId(args)),
        (request) => (sdk, options) =>
          sdk.customers.getOrCreate(request, options)
      ),
    update: async (ctx: Context, args: UpdateCustomerArgsType) =>
      await this.mutate(
        ctx,
        "customers.update",
        args,
        (identifier) => ({
          ...withoutOperationId(args),
          customerId: identifier.customerId,
        }),
        (request) => (sdk, options) => sdk.customers.update(request, options)
      ),
    delete: async (ctx: Context, args: DeleteCustomerArgsType) =>
      await this.mutate(
        ctx,
        "customers.delete",
        args,
        (identifier) => ({
          ...withoutOperationId(args),
          customerId: identifier.customerId,
        }),
        (request) => (sdk, options) => sdk.customers.delete(request, options)
      ),
  };

  entities = {
    create: async (ctx: Context, args: CreateEntityArgsType) =>
      await this.mutate(
        ctx,
        "entities.create",
        args,
        (identifier) => ({
          ...withoutOperationId(args),
          customerId: identifier.customerId,
        }),
        (request) => (sdk, options) => sdk.entities.create(request, options)
      ),
    get: async (ctx: Context, args: GetEntityArgsType) =>
      await this.read(
        ctx,
        "entities.get",
        (identifier) => ({ ...args, customerId: identifier.customerId }),
        (request) => (sdk, options) => sdk.entities.get(request, options)
      ),
    list: async (ctx: Context, args: ListEntitiesArgsType = {}) =>
      await this.read(
        ctx,
        "entities.list",
        (identifier) => ({ ...args, customerId: identifier.customerId }),
        (request) => (sdk, options) => sdk.entities.list(request, options)
      ),
    update: async (ctx: Context, args: UpdateEntityArgsType) =>
      await this.mutate(
        ctx,
        "entities.update",
        args,
        (identifier) => ({
          ...withoutOperationId(args),
          customerId: identifier.customerId,
        }),
        (request) => (sdk, options) => sdk.entities.update(request, options)
      ),
    delete: async (ctx: Context, args: DeleteEntityArgsType) =>
      await this.mutate(
        ctx,
        "entities.delete",
        args,
        (identifier) => ({
          ...withoutOperationId(args),
          customerId: identifier.customerId,
        }),
        (request) => (sdk, options) => sdk.entities.delete(request, options)
      ),
  };

  plans = {
    get: async (_ctx: Context, args: GetPlanArgsType) => {
      const call = this.transport.createCall();
      return await invokeNative("plans.get", call, args, (sdk, options) =>
        sdk.plans.get(args, options)
      );
    },
    list: async (ctx: Context, args: ListPlansArgsType = {}) =>
      await this.read(
        ctx,
        "plans.list",
        (identifier) => ({ ...args, customerId: identifier.customerId }),
        (request) => (sdk, options) => sdk.plans.list(request, options)
      ),
  };

  balances = {
    update: async (ctx: Context, args: UpdateBalanceArgsType) => {
      validateBalance(args);
      return await this.mutate(
        ctx,
        "balances.update",
        args,
        (identifier) => ({
          ...withoutOperationId(args),
          customerId: identifier.customerId,
        }),
        (request) => (sdk, options) => sdk.balances.update(request, options)
      );
    },
  };

  events = {
    list: async (ctx: Context, args: ListEventsArgsType = {}) => {
      validateListEvents(args);
      return await this.read(
        ctx,
        "events.list",
        (identifier) => ({ ...args, customerId: identifier.customerId }),
        (request) => (sdk, options) => sdk.events.list(request, options)
      );
    },
    aggregate: async (ctx: Context, args: AggregateEventsArgsType) => {
      validateAggregateEvents(args);
      return await this.read(
        ctx,
        "events.aggregate",
        (identifier) => ({ ...args, customerId: identifier.customerId }),
        (request) => (sdk, options) => sdk.events.aggregate(request, options)
      );
    },
  };

  referrals = {
    create: async (ctx: Context, args: CreateReferralCodeArgsType) =>
      await this.mutate(
        ctx,
        "referrals.create",
        args,
        (identifier) => ({
          ...withoutOperationId(args),
          customerId: identifier.customerId,
        }),
        (request) => (sdk, options) =>
          sdk.referrals.createCode(request, options)
      ),
    redeem: async (ctx: Context, args: RedeemReferralCodeArgsType) =>
      await this.mutate(
        ctx,
        "referrals.redeem",
        args,
        (identifier) => ({
          ...withoutOperationId(args),
          customerId: identifier.customerId,
        }),
        (request) => (sdk, options) =>
          sdk.referrals.redeemCode(request, options)
      ),
  };

  /**
   * Read-only generated actions, registered as public Convex actions.
   *
   * The public surface fails closed: an operation belongs here only when it
   * cannot change provider state. Every one of these reaches Autumn through
   * {@link Autumn.read}, which never derives a provider idempotency key, and
   * every route it can reach is a preview, a portal session, or a read of the
   * identified customer, its entities, its events, or the plan catalog.
   *
   * Every provider mutation, including a balance-consuming check, lives in
   * {@link Autumn.internalApi}. Billing arguments carry operator controls such
   * as `noBillingChanges`, `enablePlanImmediately`, `refundLastPayment`,
   * `subscriptionParams`, `recalculateBalances`, `carryOverUsages` and the portal
   * `configurationId`, so no client may reach them.
   */
  api() {
    return {
      check: actionGeneric({
        args: CheckArgs,
        handler: async (ctx, args) =>
          await this.actionResult(
            "check",
            async () => await this.check(ctx as Context, args)
          ),
      }),
      previewAttach: actionGeneric({
        args: PublicPreviewAttachArgs,
        handler: async (ctx, args) =>
          await this.actionResult(
            "billing.previewAttach",
            async () => await this.billing.previewAttach(ctx as Context, args)
          ),
      }),
      previewMultiAttach: actionGeneric({
        args: PublicPreviewMultiAttachArgs,
        handler: async (ctx, args) =>
          await this.actionResult(
            "billing.previewMultiAttach",
            async () =>
              await this.billing.previewMultiAttach(ctx as Context, args)
          ),
      }),
      previewUpdate: actionGeneric({
        args: PublicPreviewUpdateArgs,
        handler: async (ctx, args) =>
          await this.actionResult(
            "billing.previewUpdate",
            async () => await this.billing.previewUpdate(ctx as Context, args)
          ),
      }),
      previewMultiUpdate: actionGeneric({
        args: PublicPreviewMultiUpdateArgs,
        handler: async (ctx, args) =>
          await this.actionResult(
            "billing.previewMultiUpdate",
            async () =>
              await this.billing.previewMultiUpdate(ctx as Context, args)
          ),
      }),
      billingPortal: actionGeneric({
        args: PublicBillingPortalArgs,
        handler: async (ctx, args) =>
          await this.actionResult(
            "billing.portal",
            async () => await this.billing.portal(ctx as Context, args)
          ),
      }),
      getCustomer: actionGeneric({
        args: GetCustomerArgs,
        handler: async (ctx, args) =>
          await this.actionResult(
            "customers.get",
            async () => await this.customers.get(ctx as Context, args)
          ),
      }),
      getEntity: actionGeneric({
        args: GetEntityArgs,
        handler: async (ctx, args) =>
          await this.actionResult(
            "entities.get",
            async () => await this.entities.get(ctx as Context, args)
          ),
      }),
      listEntities: actionGeneric({
        args: ListEntitiesArgs,
        handler: async (ctx, args) =>
          await this.actionResult(
            "entities.list",
            async () => await this.entities.list(ctx as Context, args)
          ),
      }),
      getPlan: actionGeneric({
        args: GetPlanArgs,
        handler: async (ctx, args) =>
          await this.actionResult(
            "plans.get",
            async () => await this.plans.get(ctx as Context, args)
          ),
      }),
      listPlans: actionGeneric({
        args: ListPlansArgs,
        handler: async (ctx, args) =>
          await this.actionResult(
            "plans.list",
            async () => await this.plans.list(ctx as Context, args)
          ),
      }),
      listEvents: actionGeneric({
        args: ListEventsArgs,
        handler: async (ctx, args) =>
          await this.actionResult(
            "events.list",
            async () => await this.events.list(ctx as Context, args)
          ),
      }),
      aggregateEvents: actionGeneric({
        args: AggregateEventsArgs,
        handler: async (ctx, args) =>
          await this.actionResult(
            "events.aggregate",
            async () => await this.events.aggregate(ctx as Context, args)
          ),
      }),
    };
  }

  /**
   * Provider mutations, registered as Convex internal actions.
   *
   * Each of these changes state Autumn bills on, so none of them may be
   * reachable from a Convex client. Exporting them from a Convex module
   * publishes them under `internal.<module>.<name>`, where only server code can
   * call them through `ctx.runAction` or `ctx.scheduler` after it has made its
   * own authorization decision.
   *
   * Every one of them requires a `customerId` and never consults
   * `identify(ctx)`. A scheduled function has no original user auth left to
   * resolve, and a caller that still has one has already authorized the
   * operation, so the subject comes from the calling server code either way; the
   * field never reaches Autumn as a request field of its own.
   *
   * Each of them is one shot: it dispatches its request once and never retries.
   * A caller that sees an indeterminate outcome owns the decision to reconcile
   * it, because only Autumn knows whether the operation took effect.
   */
  internalApi() {
    return {
      consumeCheck: internalActionGeneric({
        args: InternalConsumeCheckArgs,
        handler: async (_ctx, args) =>
          await this.generated(
            "check",
            args,
            (identifier) => ({
              ...withoutIdentity(args),
              customerId: identifier.customerId,
              sendEvent: true as const,
            }),
            (request) => (sdk, options) => sdk.check(request, options)
          ),
      }),
      track: internalActionGeneric({
        args: InternalTrackArgs,
        handler: async (_ctx, args) =>
          await this.generated(
            "track",
            args,
            (identifier) => ({
              ...withoutIdentity(args),
              customerId: identifier.customerId,
            }),
            (request) => (sdk, options) => sdk.track(request, options),
            validateTrack
          ),
      }),
      attach: internalActionGeneric({
        args: InternalAttachArgs,
        handler: async (_ctx, args) =>
          await this.generated(
            "billing.attach",
            args,
            (identifier) => ({
              ...withoutIdentity(args),
              customerId: identifier.customerId,
            }),
            (request) => (sdk, options) => sdk.billing.attach(request, options),
            (args) => validateAttach("billing.attach", args)
          ),
      }),
      multiAttach: internalActionGeneric({
        args: InternalMultiAttachArgs,
        handler: async (_ctx, args) =>
          await this.generated(
            "billing.multiAttach",
            args,
            (identifier) => ({
              ...withoutIdentity(args),
              customerId: identifier.customerId,
            }),
            (request) => (sdk, options) =>
              sdk.billing.multiAttach(request, options),
            (args) => validateMultiAttach("billing.multiAttach", args)
          ),
      }),
      updateSubscription: internalActionGeneric({
        args: InternalUpdateSubscriptionArgs,
        handler: async (_ctx, args) =>
          await this.generated(
            "billing.update",
            args,
            (identifier) => ({
              ...withoutIdentity(args),
              customerId: identifier.customerId,
            }),
            (request) => (sdk, options) => sdk.billing.update(request, options),
            (args) =>
              validateFeatureQuantities(
                "billing.update",
                args.featureQuantities
              )
          ),
      }),
      multiUpdate: internalActionGeneric({
        args: InternalMultiUpdateArgs,
        handler: async (_ctx, args) =>
          await this.generated(
            "billing.multiUpdate",
            args,
            (identifier) => ({
              ...withoutIdentity(args),
              customerId: identifier.customerId,
            }),
            (request) => (sdk, options) =>
              sdk.billing.multiUpdate(request, options),
            (args) => validateMultiUpdate("billing.multiUpdate", args)
          ),
      }),
      setupPayment: internalActionGeneric({
        args: InternalSetupPaymentArgs,
        handler: async (_ctx, args) =>
          await this.generated(
            "billing.setupPayment",
            args,
            (identifier) => ({
              ...withoutIdentity(args),
              customerId: identifier.customerId,
            }),
            (request) => (sdk, options) =>
              sdk.billing.setupPayment(request, options),
            (args) =>
              validateFeatureQuantities(
                "billing.setupPayment",
                args.featureQuantities
              )
          ),
      }),
      getOrCreateCustomer: internalActionGeneric({
        args: InternalGetOrCreateCustomerArgs,
        handler: async (_ctx, args) =>
          await this.generated(
            "customers.getOrCreate",
            args,
            (identifier) =>
              mergeCustomerData(identifier, withoutIdentity(args)),
            (request) => (sdk, options) =>
              sdk.customers.getOrCreate(request, options)
          ),
      }),
      updateCustomer: internalActionGeneric({
        args: InternalUpdateCustomerArgs,
        handler: async (_ctx, args) =>
          await this.generated(
            "customers.update",
            args,
            (identifier) => ({
              ...withoutIdentity(args),
              customerId: identifier.customerId,
            }),
            (request) => (sdk, options) =>
              sdk.customers.update(request, options)
          ),
      }),
      deleteCustomer: internalActionGeneric({
        args: InternalDeleteCustomerArgs,
        handler: async (_ctx, args) =>
          await this.generated(
            "customers.delete",
            args,
            (identifier) => ({
              ...withoutIdentity(args),
              customerId: identifier.customerId,
            }),
            (request) => (sdk, options) =>
              sdk.customers.delete(request, options)
          ),
      }),
      createEntity: internalActionGeneric({
        args: InternalCreateEntityArgs,
        handler: async (_ctx, args) =>
          await this.generated(
            "entities.create",
            args,
            (identifier) => ({
              ...withoutIdentity(args),
              customerId: identifier.customerId,
            }),
            (request) => (sdk, options) => sdk.entities.create(request, options)
          ),
      }),
      updateEntity: internalActionGeneric({
        args: InternalUpdateEntityArgs,
        handler: async (_ctx, args) =>
          await this.generated(
            "entities.update",
            args,
            (identifier) => ({
              ...withoutIdentity(args),
              customerId: identifier.customerId,
            }),
            (request) => (sdk, options) => sdk.entities.update(request, options)
          ),
      }),
      deleteEntity: internalActionGeneric({
        args: InternalDeleteEntityArgs,
        handler: async (_ctx, args) =>
          await this.generated(
            "entities.delete",
            args,
            (identifier) => ({
              ...withoutIdentity(args),
              customerId: identifier.customerId,
            }),
            (request) => (sdk, options) => sdk.entities.delete(request, options)
          ),
      }),
      updateBalance: internalActionGeneric({
        args: InternalUpdateBalanceArgs,
        handler: async (_ctx, args) =>
          await this.generated(
            "balances.update",
            args,
            (identifier) => ({
              ...withoutIdentity(args),
              customerId: identifier.customerId,
            }),
            (request) => (sdk, options) =>
              sdk.balances.update(request, options),
            validateBalance
          ),
      }),
      createReferralCode: internalActionGeneric({
        args: InternalCreateReferralCodeArgs,
        handler: async (_ctx, args) =>
          await this.generated(
            "referrals.create",
            args,
            (identifier) => ({
              ...withoutIdentity(args),
              customerId: identifier.customerId,
            }),
            (request) => (sdk, options) =>
              sdk.referrals.createCode(request, options)
          ),
      }),
      redeemReferralCode: internalActionGeneric({
        args: InternalRedeemReferralCodeArgs,
        handler: async (_ctx, args) =>
          await this.generated(
            "referrals.redeem",
            args,
            (identifier) => ({
              ...withoutIdentity(args),
              customerId: identifier.customerId,
            }),
            (request) => (sdk, options) =>
              sdk.referrals.redeemCode(request, options)
          ),
      }),
    };
  }
}

export {
  AutumnConfigurationError,
  AutumnIndeterminateError,
  AutumnValidationError,
};
export * from "../types.js";
