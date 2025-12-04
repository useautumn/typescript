<script lang="ts">
  import { createAutumnContext, type AutumnContextValue } from "./context.svelte";
  import type { CustomerData } from "../../sdk";

  interface Props {
    /** Backend URL for API requests (optional if using same origin) */
    backendUrl?: string;
    /** Function to get the bearer token for authentication */
    getBearerToken?: () => Promise<string | null>;
    /** Customer data to pass with requests */
    customerData?: CustomerData;
    /** Whether to include credentials in requests */
    includeCredentials?: boolean;
    /** Better Auth URL (sets prefix to /api/auth/autumn) */
    betterAuthUrl?: string;
    /** Additional headers to include in requests */
    headers?: Record<string, string>;
    /** Custom path prefix for API routes (default: /api/autumn) */
    pathPrefix?: string;
    /** Default return URL for checkout/billing portal */
    defaultReturnUrl?: string;
    /** Slot content */
    children: import("svelte").Snippet;
  }

  let props: Props = $props();

  // Create the context with the provided options
  // Note: The context is created once when the provider mounts.
  // Props changes after mount won't update the client configuration.
  const context: AutumnContextValue = createAutumnContext({
    backendUrl: props.backendUrl,
    getBearerToken: props.getBearerToken,
    customerData: props.customerData,
    includeCredentials: props.includeCredentials,
    betterAuthUrl: props.betterAuthUrl,
    headers: props.headers,
    pathPrefix: props.pathPrefix,
    defaultReturnUrl: props.defaultReturnUrl,
  });
</script>

<!--
  AutumnProvider - Provides Autumn billing context to child components.
  
  @example
  ```svelte
  <script>
    import { AutumnProvider } from 'autumn-js/svelte';
  </script>

  <AutumnProvider 
    backendUrl="https://api.example.com"
    getBearerToken={() => getAuthToken()}
  >
    <App />
  </AutumnProvider>
  ```
-->

{@render props.children()}
