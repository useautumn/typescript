import { auth } from "@/lib/auth";
import { autumnHandler } from "autumn-js/next";

export const { GET, POST } = autumnHandler({
  // url: "http://localhost:8080/v1",
  identify: (request) => {
    // const session = await auth.api.getSession({
    //   headers: request.headers,
    // });

    // if (!session) {
    //   return null;
    // }

    // console.log("User:", session.user);
    return Promise.resolve({
      customerId: "123",
    });
  },
});