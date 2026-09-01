/// <reference types="vite/client" />
import { expect, test } from "vitest";
import { convexTest } from "convex-test";
import { ConvexError } from "convex/values";
export const modules = import.meta.glob("./**/*.*s");

import {
  defineSchema,
  type GenericSchema,
  type SchemaDefinition,
} from "convex/server";
import { type AutumnComponent } from "./index.js";
import { componentsGeneric } from "convex/server";
import { register } from "../test.js";

export type ErrorData = {
  code: string;
  operation: string;
  statusCode?: number;
  message: string;
};

export function response(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

/**
 * The safe payload of a generated action's error. Convex serializes
 * `ConvexError` data as JSON once it crosses an action boundary, so a caught
 * error carries either the object or its encoding depending on where it was
 * thrown.
 */
export function errorData(error: unknown): ErrorData {
  expect(error).toBeInstanceOf(ConvexError);
  const data = (error as ConvexError<ErrorData | string>).data;
  return typeof data === "string" ? (JSON.parse(data) as ErrorData) : data;
}

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
