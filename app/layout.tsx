import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Eurovision 2026 Voting",
  description: "Vote for your favourite Eurovision 2026 acts",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full stars-bg">{children}</body>
    </html>
  );
}
