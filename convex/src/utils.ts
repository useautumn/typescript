// Utility function for converting camelCase to snake_case (still needed for API calls)
export function camelToSnake<T>(input: T): any {
  if (Array.isArray(input)) {
    return input.map((item) => camelToSnake(item));
  }
  if (input !== null && typeof input === "object") {
    const result: Record<string, any> = {};
    for (const key in input) {
      if (Object.prototype.hasOwnProperty.call(input, key)) {
        const snakeKey = key.replace(/([A-Z])/g, "_$1").toLowerCase();
        result[snakeKey] = camelToSnake((input as any)[key]);
      }
    }
    return result;
  }
  return input;
}
