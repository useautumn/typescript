export interface AuthPluginOptions {
  provider: string;
  instance?: any;
  useOrg?: boolean;
  useUser?: boolean;

  // createUserAsEntity?: string;
}

declare global {
  var __autumnAuth: AuthPluginOptions;
}

export const setupAuthPlugin = (options: AuthPluginOptions) => {
  global.__autumnAuth = options;
};

export const getAuthPlugin = () => {
  return global.__autumnAuth;
};
