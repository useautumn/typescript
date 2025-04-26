"use client";

import { useState } from "react";
import SignIn from "@/components/better-auth/sign-in";
import SignUp from "@/components/better-auth/sign-up";

export default function AuthPage() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex gap-4 mb-2">
          <button
            onClick={() => setMode("signin")}
            className={`px-4 py-2 text-sm font-medium ${
              mode === "signin"
                ? "bg-gray-100 text-gray-900"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => setMode("signup")}
            className={`px-4 py-2 text-sm font-medium ${
              mode === "signup"
                ? "bg-gray-100 text-gray-900"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Sign Up
          </button>
        </div>

        <div className="bg-white">
          {mode === "signin" ? <SignIn /> : <SignUp />}
        </div>
      </div>
    </div>
  );
}
