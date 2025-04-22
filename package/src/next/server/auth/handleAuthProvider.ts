import { headers } from "next/headers";
import { AuthPluginOptions } from "./authPlugin";
import { auth, clerkClient } from "@clerk/nextjs/server";
// import { Auth } from "better-auth/*";

export const handleBetterAuth = async (options: AuthPluginOptions) => {
  let betterAuth: any = options.instance;
  if (!betterAuth) {
    throw {
      message: "BetterAuth instance is required",
      code: "auth_instance_required",
    };
  }

  if (options.useOrg) {
    try {
      let org = await betterAuth.api.getFullOrganization({
        headers: await headers(),
      });

      let session = await betterAuth.api.getSession({
        headers: await headers(),
      });

      if (org) {
        return {
          customerId: org.id,
          customerData: {
            name: org.name,
            email: session?.user?.email,
          },
        };
      }
    } catch (error) {
      throw {
        message: "Failed to get/create organization",
        code: "failed_to_create_organization",
      };
    }
  }

  if (options.useUser) {
    try {
      let session = await betterAuth.api.getSession({
        headers: await headers(),
      });

      if (session) {
        return {
          customerId: session.user.id,
          customerData: {
            name: session.user.name,
            email: session.user.email,
          },
        };
      }
    } catch (error) {
      throw {
        message: "Failed to get/create user",
        code: "failed_to_create_user",
      };
    }
  }

  return null;
};

export const handleClerk = async ({
  options,
  withCustomerData,
}: {
  options: AuthPluginOptions;
  withCustomerData: boolean;
}) => {
  let authData = await auth();

  let clerk = await clerkClient();
  if (options.useOrg) {
    try {
      let orgId = authData.orgId;
      if (orgId && withCustomerData) {
        let org = await clerk.organizations.getOrganization({
          organizationId: orgId,
        });

        let email = null;
        if (authData.userId) {
          let user = await clerk.users.getUser(authData.userId);
          email = user.primaryEmailAddress?.emailAddress;
        }

        return {
          customerId: orgId,
          customerData: {
            name: org.name,
            email: email,
          },
        };
      }
    } catch (error) {
      throw {
        message: `Failed to get/create clerk organization: ${error}`,
        code: "failed_to_create_clerk_organization",
      };
    }
  }

  if (options.useUser && authData.userId) {
    try {
      let user = await clerk.users.getUser(authData.userId);
      return {
        customerId: user.id,
        customerData: {
          name: user.fullName,
          email: user.primaryEmailAddress?.emailAddress,
        },
      };
    } catch (error) {
      throw {
        message: `Failed to get/create clerk user: ${error}`,
        code: "failed_to_create_clerk_user",
      };
    }
  }

  return null;
};

export const handleAuthProvider = ({
  authPlugin,
  withCustomerData,
}: {
  authPlugin: AuthPluginOptions;
  withCustomerData: boolean;
}) => {
  let authProvider = authPlugin.provider;

  switch (authProvider) {
    case "better-auth":
      return handleBetterAuth(authPlugin);
    case "clerk":
      return handleClerk({ options: authPlugin, withCustomerData });
    default:
      throw {
        message: `Unsupported auth provider: ${authProvider}`,
        code: "unsupported_auth_provider",
      };
  }
};
