import { Autumn } from "autumn-js";
import { autumn } from "autumn-js/better-auth";
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
  plugins: [
    organization(),
    autumn({
      // @ts-expect-error - Autumn is not typed
      client: new Autumn({
        url: "http://localhost:8080/v1",
        // secretKey: process.env.AUTUMN_SECRET_KEY,
      }),
    }),
  ],
});
