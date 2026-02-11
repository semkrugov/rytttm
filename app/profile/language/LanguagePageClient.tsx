"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import AppHeader from "@/components/AppHeader";
import BottomNavigation from "@/components/BottomNavigation";
import { useLanguage } from "@/contexts/LanguageContext";
import type { Locale } from "@/lib/translations";
import { haptics } from "@/lib/telegram";
import { cn } from "@/lib/utils";

export type LanguageCode =
  | "en"
  | "ru"
  | "fa"
  | "pt"
  | "uz"
  | "it"
  | "tr"
  | "de"
  | "es"
  | "fr"
  | "kk"
  | "be";

interface LanguageOption {
  code: LanguageCode;
  label: string;
}

const LANGUAGES: LanguageOption[] = [
  { code: "en", label: "English" },
  { code: "ru", label: "Русский" },
  { code: "fa", label: "فارسی (Farsi)" },
  { code: "pt", label: "Português" },
  { code: "uz", label: "O'zbekcha" },
  { code: "it", label: "Italiano" },
  { code: "tr", label: "Türkçe" },
  { code: "de", label: "Deutsch" },
  { code: "es", label: "Español" },
  { code: "fr", label: "Français" },
  { code: "kk", label: "Қазақша" },
  { code: "be", label: "Беларуская" },
];

const ACTIVE_LANGUAGES: Locale[] = ["en", "ru"];

export default function LanguagePageClient() {
  const router = useRouter();
  const { locale, setLocale, t } = useLanguage();

  const isActive = (code: LanguageCode): code is Locale =>
    ACTIVE_LANGUAGES.includes(code as Locale);

  const selectLanguage = (code: LanguageCode) => {
    if (!isActive(code)) return;
    haptics.light();
    setLocale(code);
  };

  return (
    <div className="min-h-screen bg-[rgba(35,36,39,1)]">
      <main
        className="mx-auto max-w-[390px] px-[18px] py-6 pb-24"
        style={{ paddingBottom: "calc(6rem + env(safe-area-inset-bottom))" }}
      >
        <AppHeader
          leftSlot={
            <button
              type="button"
              onClick={() => {
                haptics.light();
                router.back();
              }}
              className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center active:opacity-80 transition-opacity"
            >
              <ArrowLeft className="w-5 h-5 text-[#151617]" strokeWidth={2} />
            </button>
          }
        />

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, ease: [0.19, 1, 0.22, 1] }}
          className="pt-2"
        >
          <h1 className="text-[22px] font-bold text-white mb-6">{t("language.title")}</h1>

          <div className="rounded-[14px] bg-[#1E1F22] overflow-hidden">
            {LANGUAGES.map((lang, index) => {
              const active = isActive(lang.code);
              return (
                <button
                  key={lang.code}
                  type="button"
                  disabled={!active}
                  onClick={() => selectLanguage(lang.code)}
                  className={cn(
                    "w-full flex items-center justify-between px-4 py-4 text-left",
                    index !== LANGUAGES.length - 1 && "border-b border-[#28292D]",
                    !active && "cursor-not-allowed opacity-60"
                  )}
                >
                  <span
                    className={cn(
                      "text-[15px] font-medium",
                      active ? "text-white" : "text-[#9097A7]"
                    )}
                  >
                    {lang.label}
                  </span>
                  <span
                    className={cn(
                      "w-5 h-5 rounded-full flex-shrink-0",
                      active && locale === lang.code ? "bg-[#BE87D8]" : "bg-[#28292D]"
                    )}
                  />
                </button>
              );
            })}
          </div>
        </motion.div>
      </main>

      <BottomNavigation />
    </div>
  );
}
