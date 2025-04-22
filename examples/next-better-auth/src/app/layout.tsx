import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

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

import { auth } from "@/lib/auth";
export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AutumnProvider
          authPlugin={{
            provider: "better-auth",
            instance: auth,
            useOrg: true, // True if orgs are your customer
          }}
        >
          {children}
        </AutumnProvider>
      </body>
    </html>
  );
}

// <AutumnProvider
//               customerId="123"
//               customerData={{ name: "John Doe", email: "johnyeocx@gmail.com" }}
//             >
// </AutumnProvider>
