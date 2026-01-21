/**
 * In-place config update module
 * 
 * Uses line-based parsing to update autumn.config.ts while preserving:
 * - Comments (inline and block)
 * - Order of declarations
 * - Custom variable names
 */

export { updateConfigInPlace, type UpdateResult } from "./updateConfig.js";
export { parseExistingConfig, type ParsedEntity } from "./parseConfig.js";
