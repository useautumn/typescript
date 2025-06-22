// "use client";

// import { ClerkProvider, useUser } from "@clerk/nextjs";
// import { AutumnContext } from "autumn-js/react";

// // Create AutumnProvider directly in this file to test
// const LocalAutumnProvider = ({
//   children,
//   customerId,
//   customerData,
// }: {
//   children: React.ReactNode;
//   customerId: string;
//   customerData: any;
// }) => {
//   const { user } = useUser();
//   console.log("User in Local Provider:", user);

//   return (
//     <AutumnContext.Provider
//       value={{
//         customerId,
//         customerData,
//       }}
//     >
//       {children}
//     </AutumnContext.Provider>
//   );
// };

// export const AutumnClerk = ({ children }: { children: React.ReactNode }) => {
//   return (
//     <ClerkProvider>
//       <LocalAutumnProvider
//         customerId={"123"}
//         customerData={{ name: "John Doe", email: "johnyeocx@gmail.com" }}
//       >
//         {children}
//       </LocalAutumnProvider>
//     </ClerkProvider>
//   );
// };

"use client";

import { AutumnProvider } from "autumn-js/react";

export const AutumnClerk = ({ children }: { children: React.ReactNode }) => {
  return (
    <AutumnProvider
      customerId={"123"}
      customerData={{ name: "John Doe", email: "johnyeocx@gmail.com" }}
    >
      {children}
    </AutumnProvider>
  );
};
