import Database from "better-sqlite3";
import { autumn } from "autumn-js/better-auth";
import { betterAuth } from "better-auth";
import { organization } from "better-auth/plugins";
import { getSessionFromCtx } from "better-auth/api";

export const auth = betterAuth({
  database: new Database("database.sqlite"),
  trustedOrigins: ["http://localhost:3000", "http://localhost:3001"],
  secret: process.env.BETTER_AUTH_SECRET,
  emailAndPassword: {
    enabled: true,
  },
  plugins: [
    organization(),
    autumn({
      secretKey: process.env.AUTUMN_SECRET_KEY,
      // enableOrganizations: true,
      // organizationsAsCustomers: true,
      // customerScope: "user", "organization", "user_and_organization"
      identify: async ({ session, organization }) => {
        // console.log("Session: ", session);
        // console.log("Organization: ", organization);

        return {
          customerId: "abc",
          customerData: {
            name: "Test",
            email: "test@gmail.com",
          },
        };
      },
    }),
  ],
});
