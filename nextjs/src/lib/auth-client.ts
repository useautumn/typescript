import { createAuthClient } from "better-auth/react";
import { organizationClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  /** The base URL of the server (optional if you're using the same domain) */
  // baseURL: "http://localhost:3001",
  baseURL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL,
  plugins: [organizationClient()],
});
