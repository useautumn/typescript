import { ConvexError } from "convex/values";
import {
  actionGeneric,
  type GenericActionCtx,
  type GenericDataModel,
} from "convex/server";
import type { Autumn as AutumnSDK } from "autumn-js";
import type { ComponentApi } from "../component/_generated/component.js";
import {
  AggregateEventsArgs,
  type AggregateEventsArgs as AggregateEventsArgsType,
  AttachArgs,
  type AttachArgs as AttachArgsType,
  BillingPortalArgs,
  type BillingPortalArgs as BillingPortalArgsType,
  CheckArgs,
  type CheckArgs as CheckArgsType,
  CreateEntityArgs,
  type CreateEntityArgs as CreateEntityArgsType,
  CreateReferralCodeArgs,
  type CreateReferralCodeArgs as CreateReferralCodeArgsType,
  DeleteCustomerArgs,
  type DeleteCustomerArgs as DeleteCustomerArgsType,
  DeleteEntityArgs,
  type DeleteEntityArgs as DeleteEntityArgsType,
  GetCustomerArgs,
  type GetCustomerArgs as GetCustomerArgsType,
  GetEntityArgs,
  type GetEntityArgs as GetEntityArgsType,
  GetOrCreateCustomerArgs,
  type GetOrCreateCustomerArgs as GetOrCreateCustomerArgsType,
  GetPlanArgs,
  type GetPlanArgs as GetPlanArgsType,
  type Identifier,
  ListEntitiesArgs,
  type ListEntitiesArgs as ListEntitiesArgsType,
  ListEventsArgs,
  type ListEventsArgs as ListEventsArgsType,
  ListPlansArgs,
  type ListPlansArgs as ListPlansArgsType,
  MultiAttachArgs,
  type MultiAttachArgs as MultiAttachArgsType,
  MultiUpdateArgs,
  type MultiUpdateArgs as MultiUpdateArgsType,
  PreviewAttachArgs,
  type PreviewAttachArgs as PreviewAttachArgsType,
  PreviewMultiAttachArgs,
  type PreviewMultiAttachArgs as PreviewMultiAttachArgsType,
  PreviewMultiUpdateArgs,
  type PreviewMultiUpdateArgs as PreviewMultiUpdateArgsType,
  PreviewUpdateArgs,
  type PreviewUpdateArgs as PreviewUpdateArgsType,
  RedeemReferralCodeArgs,
  type RedeemReferralCodeArgs as RedeemReferralCodeArgsType,
  SetupPaymentArgs,
  type SetupPaymentArgs as SetupPaymentArgsType,
  TrackArgs,
  type TrackArgs as TrackArgsType,
  UpdateBalanceArgs,
  type UpdateBalanceArgs as UpdateBalanceArgsType,
  UpdateCustomerArgs,
  type UpdateCustomerArgs as UpdateCustomerArgsType,
  UpdateEntityArgs,
  type UpdateEntityArgs as UpdateEntityArgsType,
  UpdateSubscriptionArgs,
  type UpdateSubscriptionArgs as UpdateSubscriptionArgsType,
} from "../types.js";
import {
  AutumnConfigurationError,
  type AutumnErrorData,
  AutumnIndeterminateError,
  AutumnValidationError,
} from "../errors.js";
import { deriveOperationKeys } from "../idempotency.js";
import {
  AutumnSerializationError,
  toConvexSerializable,
} from "../serialization.js";
import {
  type AutumnCall,
  AutumnTransport,
  type AutumnTransportOptions,
  invokeNative,
  isTransportIndeterminate,
  sdkStatus,
} from "../transport.js";

export type AutumnComponent = ComponentApi;
export type AutumnOptions<Context> = AutumnTransportOptions & {
  identify: (ctx: Context) => Identifier | null | Promise<Identifier | null>;
};

type ActionContext = GenericActionCtx<GenericDataModel>;
type NativeCall<T> = (
  sdk: AutumnSDK,
  options: { retries: { strategy: "none" }; headers?: Record<string, string> }
) => Promise<T>;
type MutationArgs = { operationId: string };

function withoutOperationId<T extends MutationArgs>(
  args: T
): Omit<T, "operationId"> {
  const { operationId: _operationId, ...request } = args;
  return request;
}

function requireCondition(
  operation: string,
  condition: boolean,
  message: string
): asserts condition {
  if (!condition) throw new AutumnValidationError(operation, message);
}

function validateCheck(args: CheckArgsType): void {
  requireCondition(
    "check",
    args.sendEvent === true
      ? args.operationId !== undefined
      : args.operationId === undefined,
    args.sendEvent === true
      ? "check requires operationId when sendEvent is true."
      : "Read-only check does not accept operationId."
  );
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
    changes.length === 1,
    "balances.update requires exactly one of remaining, addToBalance or usage."
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

function mergeCustomerData(
  identifier: Identifier,
  args: GetOrCreateCustomerArgsType
): Omit<GetOrCreateCustomerArgsType, "operationId"> & { customerId: string } {
  const request = withoutOperationId(args);
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

export class Autumn<Context = unknown> {
  private readonly transport: AutumnTransport;

  constructor(
    public readonly component: AutumnComponent,
    public readonly options: AutumnOptions<Context>
  ) {
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

  private async read<Request extends object, T>(
    ctx: Context,
    operation: string,
    request: (identifier: Identifier) => Request,
    invoke: (request: Request) => NativeCall<T>
  ): Promise<T> {
    const identifier = await this.identify(ctx);
    const nativeRequest = request(identifier);
    const call = this.transport.createCall();
    return await invokeNative(operation, call, invoke(nativeRequest));
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
    const { providerKey } = await deriveOperationKeys({
      operation,
      customerId: identifier.customerId,
      operationId: args.operationId,
      request: nativeRequest,
    });
    const call = this.transport.createCall(providerKey);
    return await invokeNative(operation, call, invoke(nativeRequest));
  }

  private async actionResult(
    operation: string,
    execute: () => Promise<unknown>
  ): Promise<unknown> {
    try {
      return toConvexSerializable(await execute());
    } catch (error) {
      if (error instanceof ConvexError) throw error;
      throw new ConvexError(safeError(operation, error, sdkStatus(error)));
    }
  }

  private async generated<Request extends object, T>(
    ctx: ActionContext,
    operation: string,
    args: MutationArgs,
    request: (identifier: Identifier) => Request,
    invoke: (request: Request) => NativeCall<T>
  ): Promise<unknown> {
    try {
      const identifier = await this.identify(ctx as Context);
      const nativeRequest = request(identifier);
      const keys = await deriveOperationKeys({
        operation,
        customerId: identifier.customerId,
        operationId: args.operationId,
        request: nativeRequest,
      });
      const claim = await ctx.runMutation(this.component.lib.claimOperation, {
        ledgerKey: keys.ledgerKey,
        operation,
        requestFingerprint: keys.requestFingerprint,
      });

      if (claim.state === "succeeded") return claim.result;
      if (claim.state === "failed") throw new ConvexError(claim.error);
      if (claim.state === "conflict") {
        throw new ConvexError({
          code: "AUTUMN_OPERATION_CONFLICT",
          operation,
          message: "operationId was already used with different arguments.",
        } satisfies AutumnErrorData);
      }
      if (claim.state === "pending" || claim.state === "indeterminate") {
        throw new ConvexError({
          code: "AUTUMN_INDETERMINATE",
          operation,
          message: "The Autumn operation has an indeterminate outcome.",
        } satisfies AutumnErrorData);
      }

      try {
        await ctx.runMutation(this.component.lib.markSubmitted, {
          ledgerKey: keys.ledgerKey,
          requestFingerprint: keys.requestFingerprint,
        });
      } catch {
        throw new ConvexError({
          code: "AUTUMN_INDETERMINATE",
          operation,
          message: "The Autumn operation has an indeterminate outcome.",
        } satisfies AutumnErrorData);
      }

      let call: AutumnCall | undefined;
      try {
        call = this.transport.createCall(keys.providerKey);
        const nativeResult = await invokeNative(
          operation,
          call,
          invoke(nativeRequest)
        );
        let result: unknown;
        try {
          result = toConvexSerializable(nativeResult);
        } catch (error) {
          const terminalError = safeError(operation, error);
          await ctx.runMutation(this.component.lib.completeOperation, {
            ledgerKey: keys.ledgerKey,
            requestFingerprint: keys.requestFingerprint,
            terminal: { state: "indeterminate" },
          });
          throw new ConvexError(terminalError);
        }
        await ctx.runMutation(this.component.lib.completeOperation, {
          ledgerKey: keys.ledgerKey,
          requestFingerprint: keys.requestFingerprint,
          terminal: { state: "succeeded", result },
        });
        return result;
      } catch (error) {
        if (error instanceof ConvexError) throw error;
        const statusCode = call?.status() ?? sdkStatus(error);
        const terminalError = safeError(operation, error, statusCode);
        const indeterminate = isTransportIndeterminate(error, statusCode);
        await ctx.runMutation(this.component.lib.completeOperation, {
          ledgerKey: keys.ledgerKey,
          requestFingerprint: keys.requestFingerprint,
          terminal: indeterminate
            ? { state: "indeterminate" }
            : { state: "failed", error: terminalError },
        });
        throw new ConvexError(terminalError);
      }
    } catch (error) {
      if (error instanceof ConvexError) throw error;
      throw new ConvexError(safeError(operation, error, sdkStatus(error)));
    }
  }

  async check(ctx: Context, args: CheckArgsType) {
    validateCheck(args);
    const request = (identifier: Identifier) => ({
      ...withoutOperationId({ ...args, operationId: args.operationId ?? "" }),
      customerId: identifier.customerId,
    });
    if (args.sendEvent) {
      return await this.mutate(
        ctx,
        "check",
        { operationId: args.operationId! },
        request,
        (nativeRequest) => (sdk, options) => sdk.check(nativeRequest, options)
      );
    }
    return await this.read(
      ctx,
      "check",
      request,
      (nativeRequest) => (sdk, options) => sdk.check(nativeRequest, options)
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
        (identifier) => mergeCustomerData(identifier, args),
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
    get: async (ctx: Context, args: GetPlanArgsType) => {
      const call = this.transport.createCall();
      return await invokeNative("plans.get", call, (sdk, options) =>
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

  api() {
    return {
      check: actionGeneric({
        args: CheckArgs,
        handler: async (ctx, args) =>
          await this.actionResult("check", async () => {
            validateCheck(args);
            const request = (identifier: Identifier) => ({
              ...withoutOperationId({
                ...args,
                operationId: args.operationId ?? "",
              }),
              customerId: identifier.customerId,
            });
            if (args.sendEvent) {
              return await this.generated(
                ctx,
                "check",
                { operationId: args.operationId! },
                request,
                (nativeRequest) => (sdk, options) =>
                  sdk.check(nativeRequest, options)
              );
            }
            try {
              return toConvexSerializable(
                await this.read(
                  ctx as Context,
                  "check",
                  request,
                  (nativeRequest) => (sdk, options) =>
                    sdk.check(nativeRequest, options)
                )
              );
            } catch (error) {
              throw new ConvexError(
                safeError("check", error, sdkStatus(error))
              );
            }
          }),
      }),
      track: actionGeneric({
        args: TrackArgs,
        handler: async (ctx, args) => {
          return await this.generated(
            ctx,
            "track",
            args,
            (identifier) => {
              validateTrack(args);
              return {
                ...withoutOperationId(args),
                customerId: identifier.customerId,
              };
            },
            (request) => (sdk, options) => sdk.track(request, options)
          );
        },
      }),
      previewAttach: actionGeneric({
        args: PreviewAttachArgs,
        handler: async (ctx, args) => {
          return await this.actionResult(
            "billing.previewAttach",
            async () => await this.billing.previewAttach(ctx as Context, args)
          );
        },
      }),
      attach: actionGeneric({
        args: AttachArgs,
        handler: async (ctx, args) => {
          return await this.generated(
            ctx,
            "billing.attach",
            args,
            (identifier) => {
              validateAttach("billing.attach", args);
              return {
                ...withoutOperationId(args),
                customerId: identifier.customerId,
              };
            },
            (request) => (sdk, options) => sdk.billing.attach(request, options)
          );
        },
      }),
      previewMultiAttach: actionGeneric({
        args: PreviewMultiAttachArgs,
        handler: async (ctx, args) => {
          return await this.actionResult(
            "billing.previewMultiAttach",
            async () =>
              await this.billing.previewMultiAttach(ctx as Context, args)
          );
        },
      }),
      multiAttach: actionGeneric({
        args: MultiAttachArgs,
        handler: async (ctx, args) => {
          return await this.generated(
            ctx,
            "billing.multiAttach",
            args,
            (identifier) => {
              validateMultiAttach("billing.multiAttach", args);
              return {
                ...withoutOperationId(args),
                customerId: identifier.customerId,
              };
            },
            (request) => (sdk, options) =>
              sdk.billing.multiAttach(request, options)
          );
        },
      }),
      previewUpdate: actionGeneric({
        args: PreviewUpdateArgs,
        handler: async (ctx, args) => {
          return await this.actionResult(
            "billing.previewUpdate",
            async () => await this.billing.previewUpdate(ctx as Context, args)
          );
        },
      }),
      updateSubscription: actionGeneric({
        args: UpdateSubscriptionArgs,
        handler: async (ctx, args) => {
          return await this.generated(
            ctx,
            "billing.update",
            args,
            (identifier) => {
              validateFeatureQuantities(
                "billing.update",
                args.featureQuantities
              );
              return {
                ...withoutOperationId(args),
                customerId: identifier.customerId,
              };
            },
            (request) => (sdk, options) => sdk.billing.update(request, options)
          );
        },
      }),
      previewMultiUpdate: actionGeneric({
        args: PreviewMultiUpdateArgs,
        handler: async (ctx, args) => {
          return await this.actionResult(
            "billing.previewMultiUpdate",
            async () =>
              await this.billing.previewMultiUpdate(ctx as Context, args)
          );
        },
      }),
      multiUpdate: actionGeneric({
        args: MultiUpdateArgs,
        handler: async (ctx, args) => {
          return await this.generated(
            ctx,
            "billing.multiUpdate",
            args,
            (identifier) => {
              validateMultiUpdate("billing.multiUpdate", args);
              return {
                ...withoutOperationId(args),
                customerId: identifier.customerId,
              };
            },
            (request) => (sdk, options) =>
              sdk.billing.multiUpdate(request, options)
          );
        },
      }),
      setupPayment: actionGeneric({
        args: SetupPaymentArgs,
        handler: async (ctx, args) => {
          return await this.generated(
            ctx,
            "billing.setupPayment",
            args,
            (identifier) => {
              validateFeatureQuantities(
                "billing.setupPayment",
                args.featureQuantities
              );
              return {
                ...withoutOperationId(args),
                customerId: identifier.customerId,
              };
            },
            (request) => (sdk, options) =>
              sdk.billing.setupPayment(request, options)
          );
        },
      }),
      billingPortal: actionGeneric({
        args: BillingPortalArgs,
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
      getOrCreateCustomer: actionGeneric({
        args: GetOrCreateCustomerArgs,
        handler: async (ctx, args) =>
          await this.generated(
            ctx,
            "customers.getOrCreate",
            args,
            (identifier) => mergeCustomerData(identifier, args),
            (request) => (sdk, options) =>
              sdk.customers.getOrCreate(request, options)
          ),
      }),
      updateCustomer: actionGeneric({
        args: UpdateCustomerArgs,
        handler: async (ctx, args) =>
          await this.generated(
            ctx,
            "customers.update",
            args,
            (identifier) => ({
              ...withoutOperationId(args),
              customerId: identifier.customerId,
            }),
            (request) => (sdk, options) =>
              sdk.customers.update(request, options)
          ),
      }),
      deleteCustomer: actionGeneric({
        args: DeleteCustomerArgs,
        handler: async (ctx, args) =>
          await this.generated(
            ctx,
            "customers.delete",
            args,
            (identifier) => ({
              ...withoutOperationId(args),
              customerId: identifier.customerId,
            }),
            (request) => (sdk, options) =>
              sdk.customers.delete(request, options)
          ),
      }),
      createEntity: actionGeneric({
        args: CreateEntityArgs,
        handler: async (ctx, args) =>
          await this.generated(
            ctx,
            "entities.create",
            args,
            (identifier) => ({
              ...withoutOperationId(args),
              customerId: identifier.customerId,
            }),
            (request) => (sdk, options) => sdk.entities.create(request, options)
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
      updateEntity: actionGeneric({
        args: UpdateEntityArgs,
        handler: async (ctx, args) =>
          await this.generated(
            ctx,
            "entities.update",
            args,
            (identifier) => ({
              ...withoutOperationId(args),
              customerId: identifier.customerId,
            }),
            (request) => (sdk, options) => sdk.entities.update(request, options)
          ),
      }),
      deleteEntity: actionGeneric({
        args: DeleteEntityArgs,
        handler: async (ctx, args) =>
          await this.generated(
            ctx,
            "entities.delete",
            args,
            (identifier) => ({
              ...withoutOperationId(args),
              customerId: identifier.customerId,
            }),
            (request) => (sdk, options) => sdk.entities.delete(request, options)
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
      updateBalance: actionGeneric({
        args: UpdateBalanceArgs,
        handler: async (ctx, args) => {
          return await this.generated(
            ctx,
            "balances.update",
            args,
            (identifier) => {
              validateBalance(args);
              return {
                ...withoutOperationId(args),
                customerId: identifier.customerId,
              };
            },
            (request) => (sdk, options) => sdk.balances.update(request, options)
          );
        },
      }),
      listEvents: actionGeneric({
        args: ListEventsArgs,
        handler: async (ctx, args) => {
          return await this.actionResult(
            "events.list",
            async () => await this.events.list(ctx as Context, args)
          );
        },
      }),
      aggregateEvents: actionGeneric({
        args: AggregateEventsArgs,
        handler: async (ctx, args) => {
          return await this.actionResult(
            "events.aggregate",
            async () => await this.events.aggregate(ctx as Context, args)
          );
        },
      }),
      createReferralCode: actionGeneric({
        args: CreateReferralCodeArgs,
        handler: async (ctx, args) =>
          await this.generated(
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
      }),
      redeemReferralCode: actionGeneric({
        args: RedeemReferralCodeArgs,
        handler: async (ctx, args) =>
          await this.generated(
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
