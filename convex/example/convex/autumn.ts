import { api, components } from "./_generated/api";
import { Autumn } from "@atmn-hq/convex";

export const autumn = new Autumn(components.autumn, {
  identify: async (ctx) => {
    const user: any = await ctx.runQuery(api.auth.getCurrentUser as any, {});
    console.log("User meta", user.userId, user.name, user.email);
    if (!user) {
      throw new Error("User not found");
    }
    return {
      customerId: user.userId,
      customerData: {
        name: user.name,
        email: user.email,
      },
    };
  },
  apiKey: process.env.AUTUMN_SECRET_KEY ?? "",
});