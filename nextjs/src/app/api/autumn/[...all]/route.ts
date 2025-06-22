import { autumnHandler } from "autumn-js/next";
import { auth } from "@/lib/auth";

export const { GET, POST } = autumnHandler({
  // secretKey: process.env.AUTUMN_SECRET_KEY || "",
  // secretKey: "",
  identify: async (request) => {
    return {
      customerId: "js73k1yc9wena5g30b7cgcgwjx7cxrtk",
    };
  },
});
