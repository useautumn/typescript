import "dotenv/config";
import { autumnHandler } from "autumn-js/next";

export const { GET, POST } = autumnHandler({
	url: "http://localhost:8080/v1",
	suppressLogs: true,
	identify: async () => {
		return {
			customerId: process.env.AUTUMN_CUSTOMER_ID ?? "cus_123",
			customerData: {
				name: "John Doe",
				email: "john.doe@example.com",
			},
		};
	},
});
