// const getCustomerForAutumn = async () => {
//   // 1. Get org ID and data
//   try {
//     const org = await auth.api.getFullOrganization({
//       headers: await headers(),
//     });

//     const session = await auth.api.getSession({
//       headers: await headers(),
//     });

//     if (org) {
//       return {
//         customerId: org.id,
//         customerData: {
//           name: org.name,
//           email: session?.user?.email,
//         },
//       };
//     }

//     // 2. Get user ID and data
//     if (session) {
//       return {
//         customerId: session.user.id,
//         customerData: {
//           name: session.user.name,
//           email: session.user.email,
//         },
//       };
//     }

//     return null;
//   } catch (error) {
//     console.error(error);
//     return null;
//   }
// };
