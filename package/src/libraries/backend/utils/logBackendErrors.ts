import { logger } from "../../../utils/logger";
import { Result } from "../../../sdk/response";
import { AutumnError } from "../../../sdk";
import chalk from "chalk";

export const logBackendErrors = async (res: Result<any, AutumnError>) => {
  let { statusCode, error } = res;
  if (!error) return;

  logger.error(`[Autumn] ${error.message}`);
};
