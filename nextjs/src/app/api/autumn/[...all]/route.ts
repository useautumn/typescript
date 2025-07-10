import { autumnHandler } from "autumn-js/next";
import { NextRequest } from "next/server";

export const { GET, POST } = autumnHandler({
  url: "http://localhost:8080/v1",
  identify: async (request: NextRequest) => {
    // const session = await auth.api.getSession({
    //   headers: request.headers,
    // });
    // console.log("Session:", session);

    // if (!session) {
    //   return null;
    // }

    // console.log("User:", session.user);
    return {
      customerId: "123",
    };
  },
});
