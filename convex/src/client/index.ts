import { ConvexError } from "convex/values";
import { actionGeneric, internalActionGeneric } from "convex/server";
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
  type NativeOperation,
  type NativeRequestByOperation,
  type NativeRequestSnapshot,
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
  type NativeCall,
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

type MutationArgs = { operationId: string };
type InternalMutationArgs = MutationArgs & { customerId: string };
type IdentityField = "customerId" | "operationId";
type IdentityEntry = {
  carrier: object;
  field: IdentityField;
  value: string;
};
type CapturedIdentity = {
  source: Identifier;
  customerId: string;
};

const REQUEST_VALIDATION_MESSAGE =
  "The Autumn request contains a value Autumn cannot receive faithfully.";

class IdentifyPreDispatchError extends Error {
  constructor() {
    super("Customer identification failed before the request was sent.");
    this.name = "IdentifyPreDispatchError";
  }
}

class RequestIdentityChecks {
  private readonly entries: IdentityEntry[] = [];
  private customerId: string | undefined;

  constructor(private readonly operation: NativeOperation) {}

  capture(carrier: object, field: IdentityField): string {
    const existing = this.entries.find(
      (entry) => entry.carrier === carrier && entry.field === field
    );
    if (existing) return existing.value;

    const descriptor = this.descriptor(carrier, field);
    if (!("value" in descriptor) || typeof descriptor.value !== "string") {
      this.reject();
    }
    const value = descriptor.value;
    let actual: unknown;
    try {
      actual = Reflect.get(carrier, field);
    } catch {
      this.reject();
    }
    if (actual !== value) this.reject();
    const repeatedDescriptor = this.descriptor(carrier, field);
    if (
      !("value" in repeatedDescriptor) ||
      repeatedDescriptor.value !== value
    ) {
      this.reject();
    }

    this.entries.push({ carrier, field, value });
    if (field === "customerId") {
      if (this.customerId !== undefined && this.customerId !== value) {
        this.reject();
      }
      this.customerId = value;
    }
    return value;
  }

  assertCurrent(): void {
    for (const entry of this.entries) {
      const descriptor = this.descriptor(entry.carrier, entry.field);
      if (!("value" in descriptor) || descriptor.value !== entry.value) {
        this.reject();
      }
    }
  }

  assertRequestCustomer(request: object): void {
    if (this.customerId === undefined) return;
    const descriptor = this.descriptor(request, "customerId");
    if (!("value" in descriptor) || descriptor.value !== this.customerId) {
      this.reject();
    }
  }

  private descriptor(
    carrier: object,
    field: IdentityField
  ): PropertyDescriptor {
    try {
      const descriptor = Object.getOwnPropertyDescriptor(carrier, field);
      if (!descriptor) this.reject();
      return descriptor;
    } catch {
      this.reject();
    }
  }

  private reject(): never {
    throw new AutumnValidationError(
      this.operation,
      "Autumn request identity must use stable primitive string properties."
    );
  }
}

function copyWithout<T extends object, Key extends PropertyKey>(
  source: T,
  excluded: ReadonlySet<Key>
): Omit<T, Key> {
  const result = {} as Record<PropertyKey, unknown>;
  for (const key of Reflect.ownKeys(source)) {
    if (excluded.has(key as Key)) continue;
    const descriptor = Reflect.getOwnPropertyDescriptor(source, key);
    if (!descriptor?.enumerable) continue;
    Object.defineProperty(result, key, {
      configurable: true,
      enumerable: true,
      writable: true,
      value: Reflect.get(source, key),
    });
  }
  return result as Omit<T, Key>;
}

function withoutOperationId<T extends MutationArgs>(
  args: T
): Omit<T, "operationId"> {
  return copyWithout(args, new Set(["operationId"] as const));
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
  return copyWithout(args, new Set(["operationId", "customerId"] as const));
}

function buildRequest<Request extends object>(
  operation: NativeOperation,
  create: () => Request
): Request {
  try {
    return create();
  } catch (error) {
    if (error instanceof AutumnValidationError) throw error;
    throw new AutumnValidationError(operation, REQUEST_VALIDATION_MESSAGE);
  }
}

function requireCondition(
  operation: NativeOperation,
  condition: boolean,
  message: string
): asserts condition {
  if (!condition) throw new AutumnValidationError(operation, message);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function validateTrack(request: unknown): void {
  if (!isRecord(request)) return;
  const { featureId, eventName } = request;
  if (
    (featureId === undefined || typeof featureId === "string") &&
    (eventName === undefined || typeof eventName === "string")
  ) {
    requireCondition(
      "track",
      (featureId === undefined) !== (eventName === undefined),
      "track requires exactly one of featureId or eventName."
    );
  }
}

function validateFeatureQuantities(
  operation: NativeOperation,
  quantities: unknown
): void {
  if (quantities === undefined || !Array.isArray(quantities)) return;
  const featureIds = new Set<string>();
  for (const quantity of quantities) {
    if (!isRecord(quantity) || typeof quantity.featureId !== "string") continue;
    requireCondition(
      operation,
      !featureIds.has(quantity.featureId),
      `${operation} featureQuantities must contain each featureId at most once.`
    );
    featureIds.add(quantity.featureId);
  }
}

function validateAttach(operation: NativeOperation, request: unknown): void {
  if (!isRecord(request)) return;
  validateFeatureQuantities(operation, request.featureQuantities);
}

function validateMultiAttach(
  operation: NativeOperation,
  request: unknown
): void {
  if (!isRecord(request) || !Array.isArray(request.plans)) return;
  requireCondition(
    operation,
    request.plans.length > 0,
    `${operation} requires plans.`
  );
  for (const plan of request.plans) {
    if (isRecord(plan)) {
      validateFeatureQuantities(operation, plan.featureQuantities);
    }
  }
}

function validateMultiUpdate(
  operation: NativeOperation,
  request: unknown
): void {
  if (!isRecord(request) || !Array.isArray(request.updates)) return;
  requireCondition(
    operation,
    request.updates.length > 0,
    `${operation} requires updates.`
  );
  for (const update of request.updates) {
    if (!isRecord(update)) continue;
    const { planId, subscriptionId } = update;
    if (
      (planId === undefined || typeof planId === "string") &&
      (subscriptionId === undefined || typeof subscriptionId === "string")
    ) {
      requireCondition(
        operation,
        planId !== undefined || subscriptionId !== undefined,
        `${operation} updates require planId or subscriptionId.`
      );
    }
  }
}

function validateBalance(request: unknown): void {
  if (!isRecord(request)) return;
  const values = [request.remaining, request.addToBalance, request.usage];
  if (
    !values.every((value) => value === undefined || typeof value === "number")
  ) {
    return;
  }
  requireCondition(
    "balances.update",
    values.filter((value) => value !== undefined).length <= 1,
    "balances.update accepts at most one of remaining, addToBalance or usage."
  );
}

function validateAggregateEvents(request: unknown): void {
  if (!isRecord(request)) return;
  const { range, customRange, filterBy } = request;
  if (
    (range === undefined || typeof range === "string") &&
    (customRange === undefined || isRecord(customRange))
  ) {
    requireCondition(
      "events.aggregate",
      (range === undefined) !== (customRange === undefined),
      "events.aggregate requires exactly one of range or customRange."
    );
  }
  if (
    isRecord(customRange) &&
    typeof customRange.start === "number" &&
    typeof customRange.end === "number"
  ) {
    requireCondition(
      "events.aggregate",
      customRange.start <= customRange.end,
      "events.aggregate customRange start must not exceed end."
    );
  }
  if (
    isRecord(filterBy) &&
    Object.values(filterBy).every((value) => typeof value === "string")
  ) {
    requireCondition(
      "events.aggregate",
      Object.keys(filterBy).length <= 5,
      "events.aggregate accepts at most five filters."
    );
  }
}

function validateListEvents(request: unknown): void {
  if (!isRecord(request) || !isRecord(request.customRange)) return;
  const { start, end } = request.customRange;
  if (typeof start === "number" && typeof end === "number") {
    requireCondition(
      "events.list",
      start <= end,
      "events.list customRange start must not exceed end."
    );
  }
}

function readOnlyCheckRequest(
  identity: CapturedIdentity,
  args: CheckArgsType
): CheckArgsType & { customerId: string } {
  return {
    customerId: identity.customerId,
    featureId: args.featureId,
    entityId: args.entityId,
    requiredBalance: args.requiredBalance,
    properties: args.properties,
    withPreview: args.withPreview,
  };
}

function mergeCustomerData(
  identity: CapturedIdentity,
  request: Omit<GetOrCreateCustomerArgsType, "operationId">
): Omit<GetOrCreateCustomerArgsType, "operationId"> & { customerId: string } {
  return {
    ...identity.source.customerData,
    ...request,
    customerId: identity.customerId,
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
  if (error instanceof IdentifyPreDispatchError) {
    return {
      code: "AUTUMN_REQUEST_FAILED",
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

  private async identify(
    ctx: Context,
    operation: NativeOperation
  ): Promise<{ identity: CapturedIdentity; checks: RequestIdentityChecks }> {
    let identifier: Identifier | null;
    try {
      identifier = await this.options.identify(ctx);
    } catch (error) {
      if (error instanceof ConvexError) throw error;
      throw new IdentifyPreDispatchError();
    }
    if (typeof identifier !== "object" || identifier === null) {
      throw new AutumnConfigurationError(
        "Autumn identify(ctx) must return a customerId."
      );
    }
    const checks = new RequestIdentityChecks(operation);
    const customerId = checks.capture(identifier, "customerId");
    if (!customerId) {
      throw new AutumnConfigurationError(
        "Autumn identify(ctx) must return a customerId."
      );
    }
    return { identity: { source: identifier, customerId }, checks };
  }

  /**
   * The customer an internal action runs for.
   *
   * Scheduled work carries no original user auth, so an identity cannot be
   * derived here at all. The customer ID comes from the server code that invoked
   * the action and has already decided that the operation is allowed, which
   * holds whether or not that caller still had an identity of its own.
   */
  private trustedIdentity(
    operation: NativeOperation,
    args: InternalMutationArgs,
    checks: RequestIdentityChecks
  ): CapturedIdentity {
    const customerId = checks.capture(args, "customerId");
    requireCondition(
      operation,
      customerId.length > 0,
      `${operation} requires a customerId from its caller.`
    );
    return { source: { customerId }, customerId };
  }

  private async read<Operation extends NativeOperation, Result>(
    ctx: Context,
    operation: Operation,
    request: (
      identity: CapturedIdentity
    ) => NativeRequestByOperation[Operation],
    invoke: NativeCall<Operation, Result>,
    validate?: (
      request: NativeRequestSnapshot<NativeRequestByOperation[Operation]>
    ) => void
  ): Promise<Result> {
    const { identity, checks } = await this.identify(ctx, operation);
    const nativeRequest = buildRequest(operation, () => request(identity));
    checks.assertRequestCustomer(nativeRequest);
    checks.assertCurrent();
    const call = this.transport.createCall();
    return await invokeNative(
      operation,
      call,
      nativeRequest,
      invoke,
      (snapshot) => {
        checks.assertCurrent();
        validate?.(snapshot);
      }
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
    operation: NativeOperation,
    customerId: string,
    operationId: string
  ): Promise<AutumnCall> {
    return this.transport.createCall(
      await deriveProviderKey({
        operation,
        operationNamespace: this.options.operationNamespace,
        customerId,
        operationId,
      })
    );
  }

  private async mutate<Operation extends NativeOperation, Result>(
    ctx: Context,
    operation: Operation,
    args: MutationArgs,
    request: (
      identity: CapturedIdentity
    ) => NativeRequestByOperation[Operation],
    invoke: NativeCall<Operation, Result>,
    validate?: (
      request: NativeRequestSnapshot<NativeRequestByOperation[Operation]>
    ) => void
  ): Promise<Result> {
    const { identity, checks } = await this.identify(ctx, operation);
    const operationId = checks.capture(args, "operationId");
    const nativeRequest = buildRequest(operation, () => request(identity));
    checks.assertRequestCustomer(nativeRequest);
    checks.assertCurrent();
    const call = await this.keyedCall(
      operation,
      identity.customerId,
      operationId
    );
    return await invokeNative(
      operation,
      call,
      nativeRequest,
      invoke,
      (snapshot) => {
        checks.assertCurrent();
        validate?.(snapshot);
      }
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
   * an ambiguous outcome such as HTTP 409, an HTTP 5xx, a timeout or a dropped
   * connection becomes an `AUTUMN_INDETERMINATE` error and stays there. A valid
   * HTTP 202 track result is Autumn's accepted response and returns successfully;
   * every other 202 stays indeterminate. Nothing here retries, schedules or
   * records an attempt of its own.
   */
  private async generated<
    Operation extends NativeOperation,
    Args extends InternalMutationArgs,
    Result,
  >(
    operation: Operation,
    args: Args,
    request: (
      identity: CapturedIdentity
    ) => NativeRequestByOperation[Operation],
    invoke: NativeCall<Operation, Result>,
    validate?: (
      request: NativeRequestSnapshot<NativeRequestByOperation[Operation]>
    ) => void
  ): Promise<Result> {
    try {
      const checks = new RequestIdentityChecks(operation);
      const operationId = checks.capture(args, "operationId");
      const identity = this.trustedIdentity(operation, args, checks);
      const nativeRequest = buildRequest(operation, () => request(identity));
      checks.assertRequestCustomer(nativeRequest);
      checks.assertCurrent();
      const call = await this.keyedCall(
        operation,
        identity.customerId,
        operationId
      );
      return toConvexSerializable(
        await invokeNative(
          operation,
          call,
          nativeRequest,
          invoke,
          (snapshot) => {
            checks.assertCurrent();
            validate?.(snapshot);
          }
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
      (identity) => readOnlyCheckRequest(identity, args),
      (request, sdk, options) => sdk.check(request, options)
    );
  }

  async consumeCheck(ctx: Context, args: ConsumeCheckArgsType) {
    return await this.mutate(
      ctx,
      "check",
      args,
      (identity) => ({
        ...withoutOperationId(args),
        customerId: identity.customerId,
        sendEvent: true as const,
      }),
      (request, sdk, options) => sdk.check(request, options)
    );
  }

  async track(ctx: Context, args: TrackArgsType) {
    return await this.mutate(
      ctx,
      "track",
      args,
      (identity) => ({
        ...withoutOperationId(args),
        customerId: identity.customerId,
      }),
      (request, sdk, options) => sdk.track(request, options),
      validateTrack
    );
  }

  billing = {
    previewAttach: async (ctx: Context, args: PreviewAttachArgsType) => {
      return await this.read(
        ctx,
        "billing.previewAttach",
        (identity) => ({ ...args, customerId: identity.customerId }),
        (request, sdk, options) => sdk.billing.previewAttach(request, options),
        (request) => validateAttach("billing.previewAttach", request)
      );
    },
    attach: async (ctx: Context, args: AttachArgsType) => {
      return await this.mutate(
        ctx,
        "billing.attach",
        args,
        (identity) => ({
          ...withoutOperationId(args),
          customerId: identity.customerId,
        }),
        (request, sdk, options) => sdk.billing.attach(request, options),
        (request) => validateAttach("billing.attach", request)
      );
    },
    previewMultiAttach: async (
      ctx: Context,
      args: PreviewMultiAttachArgsType
    ) => {
      return await this.read(
        ctx,
        "billing.previewMultiAttach",
        (identity) => ({ ...args, customerId: identity.customerId }),
        (request, sdk, options) =>
          sdk.billing.previewMultiAttach(request, options),
        (request) => validateMultiAttach("billing.previewMultiAttach", request)
      );
    },
    multiAttach: async (ctx: Context, args: MultiAttachArgsType) => {
      return await this.mutate(
        ctx,
        "billing.multiAttach",
        args,
        (identity) => ({
          ...withoutOperationId(args),
          customerId: identity.customerId,
        }),
        (request, sdk, options) => sdk.billing.multiAttach(request, options),
        (request) => validateMultiAttach("billing.multiAttach", request)
      );
    },
    previewUpdate: async (ctx: Context, args: PreviewUpdateArgsType) => {
      return await this.read(
        ctx,
        "billing.previewUpdate",
        (identity) => ({ ...args, customerId: identity.customerId }),
        (request, sdk, options) => sdk.billing.previewUpdate(request, options),
        (request) => validateAttach("billing.previewUpdate", request)
      );
    },
    update: async (ctx: Context, args: UpdateSubscriptionArgsType) => {
      return await this.mutate(
        ctx,
        "billing.update",
        args,
        (identity) => ({
          ...withoutOperationId(args),
          customerId: identity.customerId,
        }),
        (request, sdk, options) => sdk.billing.update(request, options),
        (request) => validateAttach("billing.update", request)
      );
    },
    previewMultiUpdate: async (
      ctx: Context,
      args: PreviewMultiUpdateArgsType
    ) => {
      return await this.read(
        ctx,
        "billing.previewMultiUpdate",
        (identity) => ({ ...args, customerId: identity.customerId }),
        (request, sdk, options) =>
          sdk.billing.previewMultiUpdate(request, options),
        (request) => validateMultiUpdate("billing.previewMultiUpdate", request)
      );
    },
    multiUpdate: async (ctx: Context, args: MultiUpdateArgsType) => {
      return await this.mutate(
        ctx,
        "billing.multiUpdate",
        args,
        (identity) => ({
          ...withoutOperationId(args),
          customerId: identity.customerId,
        }),
        (request, sdk, options) => sdk.billing.multiUpdate(request, options),
        (request) => validateMultiUpdate("billing.multiUpdate", request)
      );
    },
    setupPayment: async (ctx: Context, args: SetupPaymentArgsType) => {
      return await this.mutate(
        ctx,
        "billing.setupPayment",
        args,
        (identity) => ({
          ...withoutOperationId(args),
          customerId: identity.customerId,
        }),
        (request, sdk, options) => sdk.billing.setupPayment(request, options),
        (request) => validateAttach("billing.setupPayment", request)
      );
    },
    portal: async (ctx: Context, args: BillingPortalArgsType = {}) =>
      await this.read(
        ctx,
        "billing.portal",
        (identity) => ({ ...args, customerId: identity.customerId }),
        (request, sdk, options) =>
          sdk.billing.openCustomerPortal(request, options)
      ),
  };

  customers = {
    get: async (ctx: Context, args: GetCustomerArgsType = {}) =>
      await this.read(
        ctx,
        "customers.get",
        (identity) => ({ ...args, customerId: identity.customerId }),
        (request, sdk, options) => sdk.customers.get(request, options)
      ),
    getOrCreate: async (ctx: Context, args: GetOrCreateCustomerArgsType) =>
      await this.mutate(
        ctx,
        "customers.getOrCreate",
        args,
        (identity) => mergeCustomerData(identity, withoutOperationId(args)),
        (request, sdk, options) => sdk.customers.getOrCreate(request, options)
      ),
    update: async (ctx: Context, args: UpdateCustomerArgsType) =>
      await this.mutate(
        ctx,
        "customers.update",
        args,
        (identity) => ({
          ...withoutOperationId(args),
          customerId: identity.customerId,
        }),
        (request, sdk, options) => sdk.customers.update(request, options)
      ),
    delete: async (ctx: Context, args: DeleteCustomerArgsType) =>
      await this.mutate(
        ctx,
        "customers.delete",
        args,
        (identity) => ({
          ...withoutOperationId(args),
          customerId: identity.customerId,
        }),
        (request, sdk, options) => sdk.customers.delete(request, options)
      ),
  };

  entities = {
    create: async (ctx: Context, args: CreateEntityArgsType) =>
      await this.mutate(
        ctx,
        "entities.create",
        args,
        (identity) => ({
          ...withoutOperationId(args),
          customerId: identity.customerId,
        }),
        (request, sdk, options) => sdk.entities.create(request, options)
      ),
    get: async (ctx: Context, args: GetEntityArgsType) =>
      await this.read(
        ctx,
        "entities.get",
        (identity) => ({ ...args, customerId: identity.customerId }),
        (request, sdk, options) => sdk.entities.get(request, options)
      ),
    list: async (ctx: Context, args: ListEntitiesArgsType = {}) =>
      await this.read(
        ctx,
        "entities.list",
        (identity) => ({ ...args, customerId: identity.customerId }),
        (request, sdk, options) => sdk.entities.list(request, options)
      ),
    update: async (ctx: Context, args: UpdateEntityArgsType) =>
      await this.mutate(
        ctx,
        "entities.update",
        args,
        (identity) => ({
          ...withoutOperationId(args),
          customerId: identity.customerId,
        }),
        (request, sdk, options) => sdk.entities.update(request, options)
      ),
    delete: async (ctx: Context, args: DeleteEntityArgsType) =>
      await this.mutate(
        ctx,
        "entities.delete",
        args,
        (identity) => ({
          ...withoutOperationId(args),
          customerId: identity.customerId,
        }),
        (request, sdk, options) => sdk.entities.delete(request, options)
      ),
  };

  plans = {
    get: async (_ctx: Context, args: GetPlanArgsType) => {
      const call = this.transport.createCall();
      return await invokeNative(
        "plans.get",
        call,
        args,
        (request, sdk, options) => sdk.plans.get(request, options)
      );
    },
    list: async (ctx: Context, args: ListPlansArgsType = {}) =>
      await this.read(
        ctx,
        "plans.list",
        (identity) => ({ ...args, customerId: identity.customerId }),
        (request, sdk, options) => sdk.plans.list(request, options)
      ),
  };

  balances = {
    update: async (ctx: Context, args: UpdateBalanceArgsType) => {
      return await this.mutate(
        ctx,
        "balances.update",
        args,
        (identity) => ({
          ...withoutOperationId(args),
          customerId: identity.customerId,
        }),
        (request, sdk, options) => sdk.balances.update(request, options),
        validateBalance
      );
    },
  };

  events = {
    list: async (ctx: Context, args: ListEventsArgsType = {}) => {
      return await this.read(
        ctx,
        "events.list",
        (identity) => ({ ...args, customerId: identity.customerId }),
        (request, sdk, options) => sdk.events.list(request, options),
        validateListEvents
      );
    },
    aggregate: async (ctx: Context, args: AggregateEventsArgsType) => {
      return await this.read(
        ctx,
        "events.aggregate",
        (identity) => ({ ...args, customerId: identity.customerId }),
        (request, sdk, options) => sdk.events.aggregate(request, options),
        validateAggregateEvents
      );
    },
  };

  referrals = {
    create: async (ctx: Context, args: CreateReferralCodeArgsType) =>
      await this.mutate(
        ctx,
        "referrals.create",
        args,
        (identity) => ({
          ...withoutOperationId(args),
          customerId: identity.customerId,
        }),
        (request, sdk, options) => sdk.referrals.createCode(request, options)
      ),
    redeem: async (ctx: Context, args: RedeemReferralCodeArgsType) =>
      await this.mutate(
        ctx,
        "referrals.redeem",
        args,
        (identity) => ({
          ...withoutOperationId(args),
          customerId: identity.customerId,
        }),
        (request, sdk, options) => sdk.referrals.redeemCode(request, options)
      ),
  };

  /**
   * Read-only generated actions, registered as public Convex actions.
   *
   * The public surface fails closed: an operation belongs here only when it
   * cannot change provider state. Every one of these reaches Autumn through
   * {@link Autumn.read}, which never derives a provider idempotency key, and
   * every route it can reach is a preview or a read of the identified customer,
   * its entities, its events, or the plan catalog.
   *
   * Every provider mutation, including a balance-consuming check, lives in
   * {@link Autumn.internalApi}. Billing arguments carry operator controls such
   * as `noBillingChanges`, `enablePlanImmediately`, `refundLastPayment`,
   * `subscriptionParams`, `recalculateBalances` and `carryOverUsages`, so no
   * client may reach them. Portal session creation stays a trusted direct method:
   * an application-owned public action must make its own billing authorization
   * decision and construct the return URL before calling it.
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
            (identity) => ({
              ...withoutIdentity(args),
              customerId: identity.customerId,
              sendEvent: true as const,
            }),
            (request, sdk, options) => sdk.check(request, options)
          ),
      }),
      track: internalActionGeneric({
        args: InternalTrackArgs,
        handler: async (_ctx, args) =>
          await this.generated(
            "track",
            args,
            (identity) => ({
              ...withoutIdentity(args),
              customerId: identity.customerId,
            }),
            (request, sdk, options) => sdk.track(request, options),
            validateTrack
          ),
      }),
      attach: internalActionGeneric({
        args: InternalAttachArgs,
        handler: async (_ctx, args) =>
          await this.generated(
            "billing.attach",
            args,
            (identity) => ({
              ...withoutIdentity(args),
              customerId: identity.customerId,
            }),
            (request, sdk, options) => sdk.billing.attach(request, options),
            (args) => validateAttach("billing.attach", args)
          ),
      }),
      multiAttach: internalActionGeneric({
        args: InternalMultiAttachArgs,
        handler: async (_ctx, args) =>
          await this.generated(
            "billing.multiAttach",
            args,
            (identity) => ({
              ...withoutIdentity(args),
              customerId: identity.customerId,
            }),
            (request, sdk, options) =>
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
            (identity) => ({
              ...withoutIdentity(args),
              customerId: identity.customerId,
            }),
            (request, sdk, options) => sdk.billing.update(request, options),
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
            (identity) => ({
              ...withoutIdentity(args),
              customerId: identity.customerId,
            }),
            (request, sdk, options) =>
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
            (identity) => ({
              ...withoutIdentity(args),
              customerId: identity.customerId,
            }),
            (request, sdk, options) =>
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
            (identity) => mergeCustomerData(identity, withoutIdentity(args)),
            (request, sdk, options) =>
              sdk.customers.getOrCreate(request, options)
          ),
      }),
      updateCustomer: internalActionGeneric({
        args: InternalUpdateCustomerArgs,
        handler: async (_ctx, args) =>
          await this.generated(
            "customers.update",
            args,
            (identity) => ({
              ...withoutIdentity(args),
              customerId: identity.customerId,
            }),
            (request, sdk, options) => sdk.customers.update(request, options)
          ),
      }),
      deleteCustomer: internalActionGeneric({
        args: InternalDeleteCustomerArgs,
        handler: async (_ctx, args) =>
          await this.generated(
            "customers.delete",
            args,
            (identity) => ({
              ...withoutIdentity(args),
              customerId: identity.customerId,
            }),
            (request, sdk, options) => sdk.customers.delete(request, options)
          ),
      }),
      createEntity: internalActionGeneric({
        args: InternalCreateEntityArgs,
        handler: async (_ctx, args) =>
          await this.generated(
            "entities.create",
            args,
            (identity) => ({
              ...withoutIdentity(args),
              customerId: identity.customerId,
            }),
            (request, sdk, options) => sdk.entities.create(request, options)
          ),
      }),
      updateEntity: internalActionGeneric({
        args: InternalUpdateEntityArgs,
        handler: async (_ctx, args) =>
          await this.generated(
            "entities.update",
            args,
            (identity) => ({
              ...withoutIdentity(args),
              customerId: identity.customerId,
            }),
            (request, sdk, options) => sdk.entities.update(request, options)
          ),
      }),
      deleteEntity: internalActionGeneric({
        args: InternalDeleteEntityArgs,
        handler: async (_ctx, args) =>
          await this.generated(
            "entities.delete",
            args,
            (identity) => ({
              ...withoutIdentity(args),
              customerId: identity.customerId,
            }),
            (request, sdk, options) => sdk.entities.delete(request, options)
          ),
      }),
      updateBalance: internalActionGeneric({
        args: InternalUpdateBalanceArgs,
        handler: async (_ctx, args) =>
          await this.generated(
            "balances.update",
            args,
            (identity) => ({
              ...withoutIdentity(args),
              customerId: identity.customerId,
            }),
            (request, sdk, options) => sdk.balances.update(request, options),
            validateBalance
          ),
      }),
      createReferralCode: internalActionGeneric({
        args: InternalCreateReferralCodeArgs,
        handler: async (_ctx, args) =>
          await this.generated(
            "referrals.create",
            args,
            (identity) => ({
              ...withoutIdentity(args),
              customerId: identity.customerId,
            }),
            (request, sdk, options) =>
              sdk.referrals.createCode(request, options)
          ),
      }),
      redeemReferralCode: internalActionGeneric({
        args: InternalRedeemReferralCodeArgs,
        handler: async (_ctx, args) =>
          await this.generated(
            "referrals.redeem",
            args,
            (identity) => ({
              ...withoutIdentity(args),
              customerId: identity.customerId,
            }),
            (request, sdk, options) =>
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
