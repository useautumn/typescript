import type { Organization } from "better-auth/plugins";
import { AuthResult } from "../AuthFunction";
import { getSessionFromCtx } from "better-auth/api";

// Get return type of getSessionFromCtx
export type Session = ReturnType<typeof getSessionFromCtx>;

export type AutumnOptions = {
  baseURL?: string;
  secretKey?: string;
  // enableOrganizations?: boolean;
  customerScope?: "user" | "organization" | "user_and_organization";
  identify?: (options: {
    session: Session;
    organization?: (Organization & { ownerEmail: string | null }) | null;
  }) => AuthResult;
  suppressLogs?: boolean;
};
