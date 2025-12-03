import { defineApp } from "convex/server";
import autumn from "@useautumn/convex/convex.config.js";

const app = defineApp();
app.use(autumn);

export default app;
