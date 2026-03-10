import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Stock Tracker — Look-Through News",
  description: "Track news for the underlying stocks in your funds",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className="antialiased h-full">{children}</body>
    </html>
  );
}
