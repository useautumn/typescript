// Polyfill localStorage for Node.js 22+ which has a broken built-in localStorage
// that requires --localstorage-file flag. This prevents "localStorage.getItem is not a function" errors.
export async function register() {
  if (typeof window === "undefined") {
    // Only run on server
    const storage = new Map<string, string>();
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (globalThis as unknown as { localStorage: Storage }).localStorage = {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => storage.set(key, String(value)),
      removeItem: (key: string) => { storage.delete(key); },
      clear: () => storage.clear(),
      key: (index: number) => Array.from(storage.keys())[index] ?? null,
      get length() {
        return storage.size;
      },
    };
  }
}
