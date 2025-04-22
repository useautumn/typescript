import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

import {
  ClerkProvider,
  OrganizationSwitcher,
  SignedIn,
  SignedOut,
  SignInButton,
  SignUpButton,
  UserButton,
} from "@clerk/nextjs";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Next.js Autumn App",
  description: "Starter Next.js app with Autumn",
};

import { AutumnProvider } from "autumn-js/next";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ClerkProvider>
          <AutumnProvider
            authPlugin={{
              provider: "clerk",
            }}
          >
            <SignedIn>
              <header className="flex justify-end items-center p-4 gap-4 h-16">
                <UserButton />
                <OrganizationSwitcher skipInvitationScreen />
              </header>
              {children}
            </SignedIn>
            <SignedOut>
              <header className="flex justify-end items-center p-4 gap-4 h-16">
                <SignInButton />
                <SignUpButton />
              </header>
              {children}
            </SignedOut>
          </AutumnProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}

// <AutumnProvider
//               customerId="123"
//               customerData={{ name: "John Doe", email: "johnyeocx@gmail.com" }}
//             >
// </AutumnProvider>
