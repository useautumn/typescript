import type { Autumn as AutumnSDK } from "autumn-js";
import { expect, test } from "vitest";
import type {
  JsonValue,
  NativeOperation,
  NativeRequestByOperation,
  NativeRequestSnapshot,
} from "./types.js";

type Assert<Value extends true> = Value;
type Equal<Left, Right> = [Left] extends [Right]
  ? [Right] extends [Left]
    ? true
    : false
  : false;
type IsAny<Value> = 0 extends 1 & Value ? true : false;
type Param<Method> = Method extends (
  request: infer Request,
  ...args: never[]
) => unknown
  ? NonNullable<Request>
  : never;
type SDKRequestByOperation = {
  check: Param<AutumnSDK["check"]>;
  track: Param<AutumnSDK["track"]>;
  "billing.previewAttach": Param<AutumnSDK["billing"]["previewAttach"]>;
  "billing.attach": Param<AutumnSDK["billing"]["attach"]>;
  "billing.previewMultiAttach": Param<
    AutumnSDK["billing"]["previewMultiAttach"]
  >;
  "billing.multiAttach": Param<AutumnSDK["billing"]["multiAttach"]>;
  "billing.previewUpdate": Param<AutumnSDK["billing"]["previewUpdate"]>;
  "billing.update": Param<AutumnSDK["billing"]["update"]>;
  "billing.previewMultiUpdate": Param<
    AutumnSDK["billing"]["previewMultiUpdate"]
  >;
  "billing.multiUpdate": Param<AutumnSDK["billing"]["multiUpdate"]>;
  "billing.setupPayment": Param<AutumnSDK["billing"]["setupPayment"]>;
  "billing.portal": Param<AutumnSDK["billing"]["openCustomerPortal"]>;
  "customers.get": Param<AutumnSDK["customers"]["get"]>;
  "customers.getOrCreate": Param<AutumnSDK["customers"]["getOrCreate"]>;
  "customers.update": Param<AutumnSDK["customers"]["update"]>;
  "customers.delete": Param<AutumnSDK["customers"]["delete"]>;
  "entities.create": Param<AutumnSDK["entities"]["create"]>;
  "entities.get": Param<AutumnSDK["entities"]["get"]>;
  "entities.list": Param<AutumnSDK["entities"]["list"]>;
  "entities.update": Param<AutumnSDK["entities"]["update"]>;
  "entities.delete": Param<AutumnSDK["entities"]["delete"]>;
  "plans.get": Param<AutumnSDK["plans"]["get"]>;
  "plans.list": Param<AutumnSDK["plans"]["list"]>;
  "balances.update": Param<AutumnSDK["balances"]["update"]>;
  "events.list": Param<AutumnSDK["events"]["list"]>;
  "events.aggregate": Param<AutumnSDK["events"]["aggregate"]>;
  "referrals.create": Param<AutumnSDK["referrals"]["createCode"]>;
  "referrals.redeem": Param<AutumnSDK["referrals"]["redeemCode"]>;
};
type Compatibility = {
  [Operation in NativeOperation]: NativeRequestSnapshot<
    NativeRequestByOperation[Operation]
  > extends SDKRequestByOperation[Operation]
    ? true
    : false;
};
type _AllSnapshotsFitTheirSDKMethod = Assert<
  Exclude<Compatibility[NativeOperation], true> extends never ? true : false
>;
type TrackProperties = NonNullable<
  NativeRequestSnapshot<NativeRequestByOperation["track"]>["properties"]
>;
type _FreeValuesAreClosed = Assert<Equal<TrackProperties[string], JsonValue>>;
type _FreeValuesAreNotAny = Assert<
  Equal<IsAny<TrackProperties[string]>, false>
>;
type _OptionalFieldsStayOptional = Assert<
  Equal<
    NativeRequestSnapshot<NativeRequestByOperation["track"]>["entityId"],
    string | undefined
  >
>;
type _ExplicitArrayUndefinedBecomesNull = Assert<
  Equal<NativeRequestSnapshot<Array<string | undefined>>, Array<string | null>>
>;
type _OnlyDeclaredFreeRootKeys = Assert<
  Equal<
    Extract<
      keyof NativeRequestByOperation["billing.attach"],
      "checkoutSessionParams" | "subscriptionParams" | "properties"
    >,
    "checkoutSessionParams"
  >
>;

const OPERATIONS = [
  "check",
  "track",
  "billing.previewAttach",
  "billing.attach",
  "billing.previewMultiAttach",
  "billing.multiAttach",
  "billing.previewUpdate",
  "billing.update",
  "billing.previewMultiUpdate",
  "billing.multiUpdate",
  "billing.setupPayment",
  "billing.portal",
  "customers.get",
  "customers.getOrCreate",
  "customers.update",
  "customers.delete",
  "entities.create",
  "entities.get",
  "entities.list",
  "entities.update",
  "entities.delete",
  "plans.get",
  "plans.list",
  "balances.update",
  "events.list",
  "events.aggregate",
  "referrals.create",
  "referrals.redeem",
] as const satisfies readonly NativeOperation[];
type _AllOperationsAreListed = Assert<
  Equal<Exclude<NativeOperation, (typeof OPERATIONS)[number]>, never>
>;

function normalizedLeafTypes(value: TrackProperties[string]): void {
  // @ts-expect-error Date methods are unavailable on closed snapshot values.
  value.getTime();
  // @ts-expect-error Uint8Array methods are unavailable on snapshot values.
  value.subarray();
}

void normalizedLeafTypes;

test("registers every native operation exactly once", () => {
  expect(OPERATIONS).toHaveLength(28);
  expect(new Set(OPERATIONS)).toHaveLength(28);
});
