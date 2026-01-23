import type { Metadata, Viewport } from "next";
import "./globals.css";
import TelegramProvider from "@/components/TelegramProvider";

export const metadata: Metadata = {
  title: "Task Tracker",
  description: "AI-powered Task Tracker Mini App for Telegram",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body>
        <TelegramProvider>{children}</TelegramProvider>
      </body>
    </html>
  );
}
