import type { Metadata, Viewport } from "next";
import Script from "next/script";
import "./globals.css";
import TelegramProvider from "@/components/TelegramProvider";
import { LanguageProvider } from "@/contexts/LanguageContext";

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
      <Script
        src="https://telegram.org/js/telegram-web-app.js"
        strategy="beforeInteractive"
      />
      <body>
        <TelegramProvider>
          <LanguageProvider>{children}</LanguageProvider>
        </TelegramProvider>
      </body>
    </html>
  );
}
