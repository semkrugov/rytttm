"use client";

import { useEffect } from "react";
import { initTelegram } from "@/lib/telegram";

export default function TelegramProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    if (typeof window !== "undefined") {
      initTelegram();
    }
  }, []);

  return <>{children}</>;
}
