"use client";

import { useState } from "react";
import { SignIn } from "@/components/auth/SignIn";
import { SignUp } from "@/components/auth/SignUp";

export default function AuthPage() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg p-8 shadow-sm">
          {mode === "signin" ? (
            <>
              <SignIn />
              <div className="mt-6 text-center">
                <p className="text-sm text-gray-600">
                  Don&apos;t have an account?{" "}
                  <button
                    onClick={() => setMode("signup")}
                    className="text-purple-600 hover:text-purple-700 font-medium focus:outline-none focus:underline"
                  >
                    Sign up
                  </button>
                </p>
              </div>
            </>
          ) : (
            <>
              <SignUp />
              <div className="mt-6 text-center">
                <p className="text-sm text-gray-600">
                  Already have an account?{" "}
                  <button
                    onClick={() => setMode("signin")}
                    className="text-purple-600 hover:text-purple-700 font-medium focus:outline-none focus:underline"
                  >
                    Sign in
                  </button>
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
