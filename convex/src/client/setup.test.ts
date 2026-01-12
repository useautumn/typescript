/// <reference types="vite/client" />

import { convexTest } from "convex-test";
import { test } from "vitest";
export const modules = import.meta.glob("./**/*.*s");

import {
	componentsGeneric,
	defineSchema,
	type GenericSchema,
	type SchemaDefinition,
} from "convex/server";
import { type AutumnComponent } from "./index.js";
import { componentsGeneric } from "convex/server";
import { register } from "../test.js";

export function initConvexTest<
	Schema extends SchemaDefinition<GenericSchema, boolean>,
>(schema?: Schema) {
  const t = convexTest(schema ?? defineSchema({}), modules);
  register(t, "autumn");
  return t;
}
export const components = componentsGeneric() as unknown as {
	autumn: AutumnComponent;
};

test("setup", () => {});
