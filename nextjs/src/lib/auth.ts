import Database from "bun:sqlite";
import { autumn } from "autumn-js/better-auth";
import { betterAuth } from "better-auth";
import { organization } from "better-auth/plugins";

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
			enableOrganizations: false,
			identify: ({ session, organization }) => {
				if (organization?.id) {
					return {
						customerId: organization.id,
						customerData: {
							email: organization.ownerEmail ?? "",
							name: organization.name ?? "",
						},
					};
				} else if (session?.userId) {
					console.log("Skipped organisation", organization?.id);
					return {
						customerId: session.userId,
						customerData: {
							email: "",
							name: "",
						},
					};
				} else {
					console.log("Skipped organisation", organization?.id);
					console.log("Skipped session", session?.userId);
					return null;
				}
			},
		}),
	],
});
