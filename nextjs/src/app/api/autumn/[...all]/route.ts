import { autumnHandler } from "autumn-js/next";

export const { GET, POST } = autumnHandler({
  identify: async () => {
    return {
      customerId: "john",
    };
  },
});
