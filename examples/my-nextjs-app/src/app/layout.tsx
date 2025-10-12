import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import InspectorInit from "@/components/InspectorInit";
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
  title: "Fortistate Demo - Ontogenetic Edition",
  description: "Comprehensive demo of Fortistate state management with ontogenetic laws",
};

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
        <InspectorInit />
        {children}
      </body>
    </html>
  );
}
