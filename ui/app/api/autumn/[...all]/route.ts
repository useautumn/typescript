import { autumnHandler } from "autumn-js/next";

import dotenv from "dotenv";
dotenv.config({ path: "../.env" });

export const { GET, POST } = autumnHandler({
  identify: async () => {
    return {
      customerId: "123",
      // customerId: undefined,
    };
  },
});
