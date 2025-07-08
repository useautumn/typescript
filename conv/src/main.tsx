import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import { AutumnProvider } from "autumn-js/react";

const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL as string);

// Convex gotchas:
// 1. Add process.env.CLIENT_ORIGIN to env variables...
// 2. Need to use VITE_CONVEX_SITE_URL as backend url, not VITE_CONVEX_URL...

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ConvexProvider client={convex}>
      <AutumnProvider
        backendUrl={import.meta.env.VITE_CONVEX_SITE_URL}
        // backendUrl="https://amiable-vole-369.convex.site"
        includeCredentials={false}
      >
        <App />
      </AutumnProvider>
    </ConvexProvider>
  </StrictMode>
);
