// app/api/autumn/[...all]/route.ts

import { autumnHandler } from "autumn-js/next";
import { auth } from "@clerk/nextjs/server";

export const { GET, POST } = autumnHandler({
  identify: async (request) => {
    const { userId } = await auth();

    if (!userId) return null;

    const customerId = "customer_id"; // get the ID you want to use for the customer

    return {
      customerId,
      // To store the customer name and email
      customerData: { name: "", email: "" },
    };
  },
});
