// import { autumnHandler } from "autumn-js/next";
// import { auth } from "@/lib/auth";
// import { headers } from "next/headers";

// export const { GET, POST } = autumnHandler({
//   identify: async () => {
//     const session = await auth.api.getSession({
//       headers: await headers(),
//     });

//     return {
//       customerId: session?.session.activeOrganizationId,
//       customerData: {
//         name: session?.user.name,
//         email: session?.user.email,
//       },
//     };
//   },
// });

// app/api/autumn/[...all]/route.ts

// import { createClient } from "@/utils/supabase/server";
// import { autumnHandler } from "autumn-js/next";

// export const { GET, POST } = autumnHandler({
//   identify: async () => {
//     const supabase = await createClient();
//     const { data, error } = await supabase.auth.getUser();

//     if (error || !data?.user) {
//       return null;
//     }

//     // Get the ID you want to use for the customer
//     const customerId = "customer_id";

//     return {
//       customerId,
//       customerData: {
//         name: data.user.user_metadata?.name,
//         email: data.user.email,
//       },
//     };
//   },
// });
