import {
  GenericActionCtx,
  httpRouter,
} from "convex/server";
import { httpAction } from "./_generated/server";
import { api, components } from "./_generated/api";
import { Autumn } from "@atmn-hq/convex";
import { verifyToken } from "@clerk/backend"

const autumn = new Autumn(components.autumn, {
  identify: async (ctx, request) => {
    try {
      if (!request) {
        return null;
      }

      const authHeader = request.headers.get("Authorization");
      const sessionCookie = request.headers.get("Cookie")?.split(";").find(cookie => cookie.trim().startsWith("__session="));
      const customAuthHeader = request.headers.get("X-Custom-Auth");
      const token = sessionCookie?.split("=")[1] ?? authHeader?.split(" ")[1] ?? customAuthHeader;

      const user = await verifyToken(token ?? "", {
        jwtKey: process.env.CLERK_JWT_KEY ?? "",
        authorizedParties: ["http://localhost:5173", process.env.CONVEX_SITE_URL ?? "", process.env.CONVEX_URL ?? ""]
      });

      if (!user) {
        return null;
      }

      return {
        customerId: user.id as string,
        customerData: {
          name: user.name as string,
          email: user.email as string,
        },
      };
    } catch (error) {
      return null;
    }
  },
  apiKey: process.env.AUTUMN_SECRET_KEY ?? "",
});

const http = httpRouter();

autumn.registerRoutes(http, {
  corsOrigin: "http://localhost:5173",
  corsAllowHeadersList: ["Authorization", "Content-Type", "Cookie", "X-Custom-Auth"],
  allowCredentials: true,
  debug: false
});

export default http;
