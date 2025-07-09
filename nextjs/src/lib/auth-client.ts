import { createAuthClient } from "better-auth/react";
import { organizationClient } from "better-auth/client/plugins";
import { autumnClient } from "autumn-js/better-auth";

export const authClient = createAuthClient({
  /** The base URL of the server (optional if you're using the same domain) */
  baseURL: "http://localhost:3001",
  plugins: [organizationClient(), autumnClient()],
});
