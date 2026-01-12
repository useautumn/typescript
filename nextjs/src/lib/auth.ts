import { autumn } from "autumn-js/better-auth";
import { betterAuth } from "better-auth";
import { organization } from "better-auth/plugins";

export const auth = betterAuth({
	// database: new Database("database.sqlite"),
	trustedOrigins: ["http://localhost:3000", "http://localhost:3001"],
	secret: process.env.BETTER_AUTH_SECRET,
	emailAndPassword: {
		enabled: true,
	},

	plugins: [
		organization(),
		autumn({
			url: "http://localhost:8080/v1",
			suppressLogs: true,
			identify: async () => {
				return {
					customerId: "1234",
					customerData: {
						name: "John Doe",
						email: "john.doe@example.com",
					},
				};
			},
		}),
	],
});
