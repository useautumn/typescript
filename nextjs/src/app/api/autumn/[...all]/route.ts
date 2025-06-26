import { autumnHandler } from "autumn-js/next";
import dotenv from "dotenv";
dotenv.config({ path: "../.env" });

export const { GET, POST } = autumnHandler({
  url: "http://localhost:8080/v1",
  identify: async (request) => {
    return {
      customerId: "123",
    };
  },
});
