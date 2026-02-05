import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NYRA - Your GenZ Health Companion",
  description: "Chat with Nyra about health, fitness, and mental wellness",
};

// Force dynamic rendering so Supabase isn't called at build time
export const dynamic = "force-dynamic";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
