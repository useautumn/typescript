import { betterAuth } from "better-auth";
import {
  createAuthEndpoint,
  createAuthMiddleware,
  organization,
} from "better-auth/plugins";
import { Pool } from "pg";

import type { BetterAuthPlugin } from "better-auth";

export const autumnPlugin = () =>
  ({
    id: "autumnPlugin",
    middlewares: [
      {
        path: "/autumn/attach",
        middleware: createAuthMiddleware(async (ctx) => {
          console.log("Inside autumn middleware!");
          return ctx.json({
            message: "Hello World",
          });
        }),
      },
    ],
    endpoints: {
      getHelloWorld: createAuthEndpoint(
        "/autumn/attach",
        {
          method: "POST",
        },
        async (ctx) => {
          console.log("Inside autumn endpoint!");
          return ctx.json({
            message: "Hello World",
          });
        }
      ),
    },
  }) satisfies BetterAuthPlugin;

export const auth = betterAuth({
  database: new Pool({
    connectionString: process.env.DATABASE_URL,
  }),
  trustedOrigins: ["http://localhost:3000", "http://localhost:3001"],
  secret: process.env.BETTER_AUTH_SECRET,
  emailAndPassword: {
    enabled: true,
  },
  plugins: [organization(), autumnPlugin()],
});
