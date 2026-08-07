import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Coagulate.dev — Coming Soon",
  description:
    "Coagulate Dev helps small businesses turn scattered tools and messy workflows into clear, automated systems — CRM and pipeline setup, workflow automation, AI-driven processes, and the websites and documentation to back it all up.",
  openGraph: {
    title: "Coagulate.dev — Coming Soon",
    description:
      "Coagulate Dev helps small businesses turn scattered tools and messy workflows into clear, automated systems.",
    url: "https://coagulate.dev",
    siteName: "Coagulate",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Coagulate.dev — Coming Soon",
    description:
      "Coagulate Dev helps small businesses turn scattered tools and messy workflows into clear, automated systems.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="antialiased">
      <body>{children}</body>
    </html>
  );
}
