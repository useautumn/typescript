import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AutumnProvider } from "autumn-js/next";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "pricecn",
  description: "Beautiful, customizable, pricing components",
};

import PaywallDialog from "@/registry/paywall-dialog";
import ProductChangeDialog from "@/registry/product-change-dialog";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="light">
      <AutumnProvider
        customerId="123"
        components={{
          paywallDialog: PaywallDialog,
          productChangeDialog: ProductChangeDialog,
        }}
      >
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased `}
        >
          {children}
        </body>
      </AutumnProvider>
    </html>
  );
}
