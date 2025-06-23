export const logFetchError = ({
  method,
  backendUrl,
  path,
  error,
}: {
  method: string;
  backendUrl: string;
  path: string;
  error: any;
}) => {
  console.error(`[Autumn] Fetch failed: ${method} ${backendUrl}${path}

Check that backendUrl in <AutumnProvider/> is correctly set.`);
};
