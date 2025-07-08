import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { autumnHandler } from "autumn-js/convex";
import { ROUTABLE_HTTP_METHODS } from "convex/server";

const http = httpRouter();
const handler = autumnHandler({
  httpAction,
  identify: async () => {
    return {
      customerId: "123",
    };
  },
});

for (const method of ROUTABLE_HTTP_METHODS) {
  http.route({
    pathPrefix: "/api/autumn/",
    method,
    handler,
  });
}

// Convex expects the router to be the default export of `convex/http.js`.
export default http;
