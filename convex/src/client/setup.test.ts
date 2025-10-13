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
import componentSchema from "../component/schema.js";
import type { AutumnComponent } from "./index.js";
export { componentSchema };
export const componentModules = import.meta.glob("../component/**/*.ts");

export function initConvexTest<
	Schema extends SchemaDefinition<GenericSchema, boolean>,
>(schema?: Schema) {
	const t = convexTest(schema ?? defineSchema({}), modules);
	t.registerComponent("autumn", componentSchema, componentModules);
	return t;
}
export const components = componentsGeneric() as unknown as {
	autumn: AutumnComponent;
};

test("setup", () => {});
