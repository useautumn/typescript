import { Autumn } from "./client";
import queryString from "query-string";

export const staticWrapper = <TArgs extends Record<string, any>, TReturn>(
  callback: (params: { instance: Autumn } & TArgs) => Promise<TReturn>,
  instance: Autumn | undefined,
  args: TArgs
): Promise<TReturn> => {
  if (!instance) {
    instance = new Autumn();
  }

  return callback({ instance, ...args });
};

export const buildQueryString = (params?: Record<string, any>): string => {
  if (!params) return "";
  
  return queryString.stringify(params, { 
    skipNull: true, 
    skipEmptyString: true 
  });
};

export const buildPathWithQuery = (basePath: string, params?: Record<string, any>): string => {
  const query = buildQueryString(params);
  return query ? `${basePath}?${query}` : basePath;
};
