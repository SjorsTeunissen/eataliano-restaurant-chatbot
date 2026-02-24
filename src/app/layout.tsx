import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AIboy — Claude Code Telegram Notifications",
  description:
    "Get notified on Telegram when Claude Code finishes a task.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-950 text-gray-100 antialiased">
        {children}
      </body>
    </html>
  );
}
