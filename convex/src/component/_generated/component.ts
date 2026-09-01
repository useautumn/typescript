/* eslint-disable */
/**
 * Generated `ComponentApi` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type { FunctionReference } from "convex/server";

export type ComponentApi<Name extends string | undefined = string | undefined> =
  {
    lib: {
      claimOperation: FunctionReference<
        "mutation",
        "internal",
        {
          ledgerKey: string;
          operation: string;
          requestFingerprint: string;
          attemptToken: string;
        },
        | { state: "claimed" }
        | { state: "conflict" }
        | { state: "pending" }
        | { state: "indeterminate" }
        | { state: "succeeded"; result: any }
        | {
            state: "failed";
            error: {
              code: string;
              operation: string;
              statusCode?: number;
              message: string;
            };
          },
        Name
      >;
      markSubmitted: FunctionReference<
        "mutation",
        "internal",
        {
          ledgerKey: string;
          requestFingerprint: string;
          attemptToken: string;
        },
        null,
        Name
      >;
      completeOperation: FunctionReference<
        "mutation",
        "internal",
        {
          ledgerKey: string;
          requestFingerprint: string;
          attemptToken: string;
          terminal:
            | { state: "succeeded"; result: any }
            | {
                state: "failed";
                error: {
                  code: string;
                  operation: string;
                  statusCode?: number;
                  message: string;
                };
              }
            | { state: "indeterminate" };
        },
        null,
        Name
      >;
    };
  };
