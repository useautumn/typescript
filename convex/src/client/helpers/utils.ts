export type PlainError = { message: string; code: string };

export const toPlainError = (error: unknown): PlainError => {
  if (error && typeof error === "object") {
    const errorObj = error as Record<string, unknown>;
    const message =
      typeof errorObj.message === "string"
        ? errorObj.message
        : JSON.stringify(errorObj.message ?? "Unknown error");
    const code =
      typeof errorObj.code === "string"
        ? errorObj.code
        : "unknown_error";
    return { message, code };
  }
  return { message: String(error ?? "Unknown error"), code: "unknown_error" };
};

export async function wrapSdkCall<T>(fn: () => Promise<T>): Promise<
  T extends { error?: any }
    ? Omit<T, "error"> & { error: PlainError | null }
    : T | { data: null; error: PlainError }
> {
  try {
    const res = await fn();
    if (res && typeof res === "object" && "error" in res) {
      return {
        ...(res as Omit<T, "error">),
        error: (res as any).error ? toPlainError((res as any).error) : null,
      } as any;
    }
    return res as any;
  } catch (error) {
    return { data: null, error: toPlainError(error) } as any;
  }
}
