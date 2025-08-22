// import "./App.css";
import React, { useEffect, useState } from "react";
import { Authenticated, AuthLoading, Unauthenticated } from "convex/react";
import { AutumnProvider } from "autumn-js/react";
import { ConvexBetterAuthProvider } from "@convex-dev/better-auth/react";
import { ConvexReactClient } from "convex/react";
import { authClient } from "./lib/auth-client";
import { AutumnJSCustomerSection } from "./components/AutumnJSCustomerSection";
import { ConvexCustomerSection } from "./components/ConvexCustomerSection";
import { DebugConsole } from "./components/DebugConsole";

const address = import.meta.env.VITE_CONVEX_URL || "";
const convex = new ConvexReactClient(address);

function AutumnWrapper({ children }: { children: React.ReactNode }) {
  const [authToken, setAuthToken] = useState<string | null>(null);

  useEffect(() => {
    const getToken = async () => {
      try {
        const token = await authClient.getCookie();
        console.log("Token:", token);
        setAuthToken(token);
      } catch (error) {
        console.error("Failed to get auth token:", error);
      }
    };

    getToken();
  }, []);

  return (
    <AutumnProvider
      backendUrl={import.meta.env.VITE_CONVEX_SITE_URL}
      includeCredentials={true}
      headers={{
        "Better-Auth-Cookie": authToken ?? "",
      }}
    >
      {children}
    </AutumnProvider>
  );
}

function App() {
  return (
    <div className="bg-gray-900 text-white min-h-screen w-screen overflow-x-hidden">
      <ConvexBetterAuthProvider client={convex} authClient={authClient}>
        <AutumnWrapper>
          <AuthLoading>
            <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 to-gray-800">
              <h2 className="text-center py-8 pb-4 text-2xl font-semibold text-white">
                Loading...
              </h2>
            </div>
          </AuthLoading>

          <Unauthenticated>
            <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 to-gray-800">
              <h2 className="text-center py-8 pb-4 text-2xl font-semibent text-white">
                Convex Autumn Component Example
              </h2>
              <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 shadow-2xl p-8 max-w-md w-full mx-4">
                <h3 className="text-center text-lg font-medium text-gray-200 mb-6">
                  Sign in to get started
                </h3>
                <div className="flex flex-col gap-3">
                  <button
                    className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                    onClick={async () => {
                      try {
                        await authClient.signIn.email({
                          email: "test@test.com",
                          password: "test!@523dsgsAFF",
                        });
                      } catch (error) {
                        console.error("Sign in error:", error);
                      }
                    }}
                  >
                    Sign in
                  </button>
                  <button
                    className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                    onClick={async () => {
                      try {
                        await authClient.signUp.email({
                          email: "test@test.com",
                          password: "test!@523dsgsAFF",
                          name: "Test User",
                        });
                      } catch (error) {
                        console.error("Sign up error:", error);
                      }
                    }}
                  >
                    Sign up
                  </button>
                </div>
              </div>
            </div>
          </Unauthenticated>

          <Authenticated>
            <div className="flex flex-col min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 w-screen pb-64 overflow-hidden">
              <div className="flex-1 grid grid-cols-2 w-screen overflow-hidden">
                <div className="border-r border-gray-700/50 flex flex-col justify-center items-center p-8 w-full overflow-y-auto w-full">
                  <div className="w-full max-w-lg">
                    <h2 className="text-center text-2xl font-bold text-white mb-8">
                      Autumn without Convex
                    </h2>
                    <AutumnJSCustomerSection />
                  </div>
                </div>

                <div className="flex flex-col justify-center items-center p-8 w-full overflow-y-auto w-full">
                  <div className="w-full max-w-lg">
                    <h2 className="text-center text-2xl font-bold text-white mb-8">
                      Autumn with Convex
                    </h2>
                    <ConvexCustomerSection />
                  </div>
                </div>
              </div>
            </div>

            <DebugConsole />
          </Authenticated>
        </AutumnWrapper>
      </ConvexBetterAuthProvider>
    </div>
  );
}

export default App;
