import { AutumnContext, useAutumnContext } from "../AutumnContext";

export const useProductsBase = () => {
  const context = useAutumnContext({ AutumnContext, name: "useProducts" });

  const fetcher = async () => {
    const { data, error } = await context.client.products.list();
    if (error) throw error;
    return data?.list || [];
  };
};
