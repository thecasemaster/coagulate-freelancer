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
  title: "Coagulate — AI Client Portal for Freelancers",
  description:
    "One link. Every client. Zero chaos. Give your freelance clients a branded portal for files, invoices, messages, and updates — powered by AI.",
  openGraph: {
    title: "Coagulate — AI Client Portal for Freelancers",
    description:
      "One link for all client files, invoices, and messages. Powered by AI that handles the admin you hate.",
    url: "https://coagulate.dev",
    siteName: "Coagulate",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Coagulate — AI Client Portal for Freelancers",
    description:
      "One link for all client files, invoices, and messages. Powered by AI.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
