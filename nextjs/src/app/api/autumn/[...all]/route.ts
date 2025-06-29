import { auth } from "@/lib/auth";
import { autumnHandler } from "autumn-js/next";
import { NextRequest } from "next/server";

export const { GET, POST } = autumnHandler({
  secretKey: "am_sk_test_C4kxVLxn9waAHpdBAQvyDSyEr368a9iFOEQuSjHEXd",
  url: "http://localhost:8080/v1",
  identify: async (request: NextRequest) => {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session) {
      return null;
    }

    // console.log("User:", session.user);
    return {
      customerId: "123",
    };
  },
});