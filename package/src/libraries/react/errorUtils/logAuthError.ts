import { AutumnError } from "../../../sdk";

export const logAuthError = async (response: Response) => {
  let data = await response.json();

  console.error(`[Autumn] ${data.message}`);

  return {
    data: null,
    error: new AutumnError({
      message: data.message,
      code: data.code,
    }),
  };
};
