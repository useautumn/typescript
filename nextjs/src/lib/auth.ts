import { betterAuth } from "better-auth";
import { organization } from "better-auth/plugins";

import { Pool } from "pg";

export const auth = betterAuth({
  database: new Pool({
    connectionString: process.env.DATABASE_URL,
  }),
  trustedOrigins: ["http://localhost:3000", "http://localhost:3001"],
  secret: process.env.BETTER_AUTH_SECRET,
  emailAndPassword: {
    enabled: true,
  },
  plugins: [organization()],
});
