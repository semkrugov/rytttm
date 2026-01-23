"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, XCircle, Copy, X } from "lucide-react";

interface WebAppStatus {
  available: boolean;
  version?: string;
  platform?: string;
  initData?: string;
  initDataUnsafe?: any;
  ready?: boolean;
  expanded?: boolean;
}

export default function MiniAppDebugPage() {
  const [status, setStatus] = useState<WebAppStatus>({
    available: false,
  });
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const webApp = (window as any).Telegram?.WebApp;

    if (webApp) {
      // Вызываем ready() и expand()
      webApp.ready();
      webApp.expand();

      // Получаем статус
      const initData = webApp.initData || "";
      const initDataUnsafe = webApp.initDataUnsafe || {};

      setStatus({
        available: true,
        version: webApp.version || "unknown",
        platform: webApp.platform || "unknown",
        initData: initData,
        initDataUnsafe: initDataUnsafe,
        ready: true,
        expanded: true,
      });
    } else {
      setStatus({
        available: false,
      });
    }
  }, []);

  const handleClose = () => {
    if (typeof window === "undefined") return;
    const webApp = (window as any).Telegram?.WebApp;
    if (webApp?.close) {
      webApp.close();
    }
  };

  const handleCopyInitData = async () => {
    if (!status.initData) return;

    try {
      await navigator.clipboard.writeText(status.initData);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--tg-theme-bg-color)] p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.19, 1, 0.22, 1] }}
        className="max-w-2xl mx-auto"
      >
        <h1 className="text-2xl font-bold text-[var(--tg-theme-text-color)] mb-6">
          Telegram Mini App Debug
        </h1>

        {/* Статус WebApp */}
        <div className="bg-[var(--tg-theme-secondary-bg-color)] rounded-lg p-4 mb-4">
          <div className="flex items-center gap-2 mb-4">
            {status.available ? (
              <CheckCircle2 className="w-5 h-5 text-green-500" />
            ) : (
              <XCircle className="w-5 h-5 text-red-500" />
            )}
            <span className="text-[var(--tg-theme-text-color)] font-semibold">
              WebApp {status.available ? "доступен" : "не доступен"}
            </span>
          </div>

          {status.available && (
            <div className="space-y-2 text-sm text-[var(--tg-theme-hint-color)]">
              <div>
                <span className="font-medium">Версия:</span> {status.version}
              </div>
              <div>
                <span className="font-medium">Платформа:</span> {status.platform}
              </div>
              <div>
                <span className="font-medium">ready():</span>{" "}
                {status.ready ? "✅ вызван" : "❌ не вызван"}
              </div>
              <div>
                <span className="font-medium">expand():</span>{" "}
                {status.expanded ? "✅ вызван" : "❌ не вызван"}
              </div>
            </div>
          )}
        </div>

        {/* InitData */}
        {status.initData && (
          <div className="bg-[var(--tg-theme-secondary-bg-color)] rounded-lg p-4 mb-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-semibold text-[var(--tg-theme-text-color)]">
                initData
              </h2>
              <button
                onClick={handleCopyInitData}
                className="flex items-center gap-2 px-3 py-1.5 bg-[var(--tg-theme-button-color)] text-[var(--tg-theme-button-text-color)] rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
              >
                {copied ? (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    Скопировано
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Скопировать
                  </>
                )}
              </button>
            </div>
            <div className="bg-[var(--tg-theme-bg-color)] rounded p-3 text-xs text-[var(--tg-theme-hint-color)] font-mono break-all overflow-x-auto">
              {status.initData}
            </div>
          </div>
        )}

        {/* InitDataUnsafe */}
        {status.initDataUnsafe && (
          <div className="bg-[var(--tg-theme-secondary-bg-color)] rounded-lg p-4 mb-4">
            <h2 className="text-lg font-semibold text-[var(--tg-theme-text-color)] mb-2">
              initDataUnsafe
            </h2>
            <div className="bg-[var(--tg-theme-bg-color)] rounded p-3 text-xs text-[var(--tg-theme-hint-color)] font-mono overflow-x-auto">
              <pre>{JSON.stringify(status.initDataUnsafe, null, 2)}</pre>
            </div>
          </div>
        )}

        {/* Кнопки действий */}
        <div className="space-y-3">
          <button
            onClick={handleClose}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition-colors"
          >
            <X className="w-5 h-5" />
            Закрыть mini app
          </button>
        </div>

        {/* Предупреждение если WebApp не доступен */}
        {!status.available && (
          <div className="mt-4 p-4 bg-yellow-500/20 border border-yellow-500/50 rounded-lg text-sm text-[var(--tg-theme-text-color)]">
            ⚠️ WebApp не доступен. Откройте эту страницу внутри Telegram Mini App для полной функциональности.
          </div>
        )}
      </motion.div>
    </div>
  );
}
