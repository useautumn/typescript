import { auth, currentUser } from "@clerk/nextjs/server";
import { AuthProvider } from "../../enums";

export const getCustomerIdDefault = () => {
  return {
    [AuthProvider.Clerk]: async (withCusData: boolean) => {
      if (!withCusData) {
        const { userId } = await auth();
        return {
          customerId: userId,
        };
      } else {
        const user = await currentUser();
        return {
          customerId: user?.id,
          customerData: {
            email: user?.primaryEmailAddress?.emailAddress,
            name: user?.fullName,
          },
        };
      }
    },
  };
};
