// Create a separate file that manages the import
// clerks-wrapper.ts
let clerkModule: any = null;

export async function getClerkModule() {
  if (!clerkModule) {
    try {
      clerkModule = await import(
        /* webpackIgnore: true */ "@clerk/nextjs/server"
      );
    } catch (e) {
      throw {
        message:
          "Failed to import @clerk/nextjs. Please ensure you have the @clerk/nextjs package installed.",
        code: "failed_to_import_clerk_nextjs",
      };
    }
  }
  return clerkModule;
}
