import { autumnHandler } from "autumn-js/next";

export const { GET, POST } = autumnHandler({
  identify: async () => {
    return {
      customerId: "30175f6c-9219-40f9-893d-1ca4917d1c07",
    };
  },
});
