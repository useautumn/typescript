import { autumnHandler } from "autumn-js/next";

export const { GET, POST } = autumnHandler({
  // url: "http://localhost:8080/v1",
  identify: async () => {
    return {
      customerId: "b5yy7iKKRaVnF1TXzSFWm1",
    };
  },
});
