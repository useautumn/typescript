function stringToSnakeCase(str: string): string {
  return str
    .replace(/([a-z])([A-Z])/g, "$1_$2")
    .replace(/[-\s]+/g, "_")
    .toLowerCase();
}

export const toSnakeCase = (obj: any, excludeKeys?: string[]): any => {
  if (Array.isArray(obj)) {
    return obj.map((item) => toSnakeCase(item, excludeKeys));
  } else if (obj !== null && typeof obj === "object") {
    return Object.fromEntries(
      Object.entries(obj).map(([key, value]) => {
        const snakeKey = stringToSnakeCase(key);

        // If this key should be excluded, convert the key but keep the value as-is
        if (excludeKeys && excludeKeys.includes(key)) {
          return [snakeKey, value];
        }

        // Otherwise, convert both key and recursively process the value
        return [snakeKey, toSnakeCase(value, excludeKeys)];
      })
    );
  }
  return obj;
};

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
