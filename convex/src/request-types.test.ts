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
