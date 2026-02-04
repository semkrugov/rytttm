"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Settings,
  Music2,
  CreditCard,
  Smartphone,
  Wallet,
  Calendar,
  Copy,
  Info,
} from "lucide-react";
import AppHeader from "@/components/AppHeader";
import BottomNavigation from "@/components/BottomNavigation";
import { useLanguage } from "@/contexts/LanguageContext";
import { haptics } from "@/lib/telegram";
import { cn } from "@/lib/utils";

type PaymentMethod = "card" | "phone" | "wallet";

const DEMO_HISTORY = [
  { id: "1", label: "FLOW", status: "success" as const, date: "12.01.26" },
  { id: "2", label: "SYNC", status: null, date: "" },
  { id: "3", label: "SYNC", status: null, date: "" },
];

const REFERRAL_URL = "https://rytttm.com/van_tolk";

export default function PaymentPageClient() {
  const router = useRouter();
  const { t } = useLanguage();
  const [method, setMethod] = useState<PaymentMethod>("card");
  const [autoPay, setAutoPay] = useState(false);

  const copyReferralLink = async () => {
    try {
      await navigator.clipboard.writeText(REFERRAL_URL);
      haptics.success();
    } catch {
      haptics.medium();
    }
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
              className="w-10 h-10 rounded-full bg-[var(--tg-theme-secondary-bg-color)]/80 flex items-center justify-center"
            >
              <ArrowLeft className="w-5 h-5 text-[var(--tg-theme-text-color)]" strokeWidth={2} />
            </button>
          }
        />

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, ease: [0.19, 1, 0.22, 1] }}
          className="pt-2"
        >
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-[22px] font-bold text-white">{t("payment.title")}</h1>
            <button
              type="button"
              onClick={() => haptics.light()}
              className="flex items-center gap-1.5 text-[#9097A7] text-[14px] font-medium"
            >
              <Settings className="w-4 h-4" strokeWidth={2} />
              {t("payment.aboutTariffs")}
            </button>
          </div>

          {/* Current plan */}
          <div className="rounded-[14px] bg-[#1E1F22] p-4 mb-6 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#BE87D8] to-[#E8A0C8] flex items-center justify-center flex-shrink-0">
              <Music2 className="w-5 h-5 text-white" strokeWidth={2} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[15px] font-semibold text-white">{t("profile.mvp")}</p>
              <p
                className="text-[22px] font-bold bg-clip-text text-transparent"
                style={{ backgroundImage: "linear-gradient(90deg, #BE87D8 0%, #E8A0C8 100%)" }}
              >
                {t("payment.free")}
              </p>
            </div>
          </div>

          {/* Payment method */}
          <div className="mb-6">
            <h2 className="text-[11px] font-medium uppercase tracking-wider text-[#9097A7] mb-3">
              {t("payment.method")}
            </h2>
            <div className="flex gap-2 p-1 rounded-[12px] bg-[#1E1F22]">
              {(
                [
                  { id: "card" as const, key: "payment.card", icon: CreditCard },
                  { id: "phone" as const, key: "payment.phone", icon: Smartphone },
                  { id: "wallet" as const, key: "payment.wallet", icon: Wallet },
                ] as const
              ).map(({ id, key, icon: Icon }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => {
                    haptics.light();
                    setMethod(id);
                  }}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-[10px] text-[14px] font-medium transition-colors",
                    method === id
                      ? "bg-[#28292D] text-white"
                      : "text-[#9097A7]"
                  )}
                >
                  <Icon className="w-4 h-4" strokeWidth={2} />
                  {t(key)}
                </button>
              ))}
            </div>

            {method === "card" && (
              <div className="mt-4 rounded-[14px] bg-[#1E1F22] p-4 space-y-3">
                <div>
                  <label className="text-[11px] font-medium uppercase tracking-wider text-[#9097A7] block mb-1">
                    {t("payment.number")}
                  </label>
                  <div className="px-4 py-3 rounded-[10px] bg-[#28292D] text-white text-[15px]">
                    •••• •••• •••• 0000
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="flex-1">
                    <label className="text-[11px] font-medium uppercase tracking-wider text-[#9097A7] block mb-1">
                      {t("payment.expiry")}
                    </label>
                    <div className="px-4 py-3 rounded-[10px] bg-[#28292D] text-white text-[15px]">
                      12 / 30
                    </div>
                  </div>
                  <div className="w-24">
                    <label className="text-[11px] font-medium uppercase tracking-wider text-[#9097A7] block mb-1">
                      {t("payment.cvv")}
                    </label>
                    <div className="px-4 py-3 rounded-[10px] bg-[#28292D] text-white text-[15px]">
                      •••
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      haptics.light();
                      setAutoPay(!autoPay);
                    }}
                    className="flex items-center gap-2 text-[15px] font-medium text-white"
                  >
                    <span
                      className={cn(
                        "w-5 h-5 rounded border-2 flex items-center justify-center",
                        autoPay ? "bg-[#BE87D8] border-[#BE87D8]" : "border-[#28292D]"
                      )}
                    >
                      {autoPay && <span className="text-white text-xs">✓</span>}
                    </span>
                    {t("payment.autoPay")}
                  </button>
                  <button
                    type="button"
                    onClick={() => haptics.light()}
                    className="px-4 py-2 rounded-[10px] bg-[#28292D] text-[#9097A7] text-[14px] font-medium"
                  >
                    {t("payment.relink")}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* History */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-[11px] font-medium uppercase tracking-wider text-[#9097A7]">
                {t("payment.history")}
              </h2>
              <button
                type="button"
                onClick={() => haptics.light()}
                className="flex items-center gap-1.5 text-[#9097A7] text-[13px] font-medium"
              >
                <Calendar className="w-4 h-4" strokeWidth={2} />
                {t("payment.allPayments")}
              </button>
            </div>
            <div className="rounded-[14px] bg-[#1E1F22] overflow-hidden">
              {DEMO_HISTORY.map((item, index) => (
                <div
                  key={item.id}
                  className={cn(
                    "flex items-center justify-between px-4 py-3",
                    index !== DEMO_HISTORY.length - 1 && "border-b border-[#28292D]"
                  )}
                >
                  <span className="text-[15px] font-medium text-white">{item.label}</span>
                  <div className="flex items-center gap-3">
                    {item.status === "success" && (
                      <span className="text-[13px] font-medium text-[#22C55E]">
                        {t("payment.successful")}
                      </span>
                    )}
                    {item.date && (
                      <span className="text-[13px] text-[#9097A7]">{item.date}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Referral link */}
          <div className="mb-6">
            <h2 className="text-[11px] font-medium uppercase tracking-wider text-[#9097A7] mb-3">
              {t("payment.referralLink")}
            </h2>
            <div className="flex items-center gap-2 rounded-[14px] bg-[#1E1F22] px-4 py-3">
              <input
                type="text"
                readOnly
                value={REFERRAL_URL}
                className="flex-1 min-w-0 bg-transparent text-white text-[14px] outline-none"
              />
              <button
                type="button"
                onClick={() => {
                  haptics.light();
                  copyReferralLink();
                }}
                className="w-10 h-10 rounded-full bg-[#28292D] flex items-center justify-center flex-shrink-0"
              >
                <Copy className="w-5 h-5 text-[#9097A7]" strokeWidth={2} />
              </button>
            </div>
          </div>

          {/* Referral program */}
          <div className="mb-6">
            <h2 className="text-[11px] font-medium uppercase tracking-wider text-[#9097A7] mb-3">
              {t("payment.referralProgram")}
            </h2>
            <div className="rounded-[14px] bg-[#1E1F22] p-4 space-y-4">
              {[
                { num: 1, key: "payment.levelDirect" },
                { num: 2, key: "payment.levelIndirect" },
                { num: 3, key: "payment.levelNetwork" },
              ].map(({ num, key }) => (
                <div key={num} className="flex items-start gap-3">
                  <span
                    className="w-7 h-7 rounded-full flex items-center justify-center text-[13px] font-bold text-white flex-shrink-0"
                    style={{ background: "linear-gradient(135deg, #BE87D8 0%, #E8A0C8 100%)" }}
                  >
                    {num}
                  </span>
                  <p className="text-[14px] text-white leading-snug pt-0.5">{t(key)}</p>
                </div>
              ))}
              <div className="flex items-start gap-2 pt-2">
                <Info className="w-4 h-4 text-[#9097A7] flex-shrink-0 mt-0.5" strokeWidth={2} />
                <p className="text-[13px] text-[#9097A7] leading-snug">{t("payment.referralInfo")}</p>
              </div>
            </div>
          </div>

          {/* My level */}
          <div>
            <h2 className="text-[11px] font-medium uppercase tracking-wider text-[#9097A7] mb-3">
              {t("payment.myLevel")}
            </h2>
            <div className="rounded-[14px] bg-[#1E1F22] p-4 flex items-center gap-4">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold text-white flex-shrink-0 border-2"
                style={{ borderColor: "#BE87D8", background: "rgba(190, 135, 216, 0.2)" }}
              >
                2
              </div>
              <div>
                <p className="text-[15px] font-medium text-white">{t("payment.indirect")}</p>
                <p
                  className="text-[24px] font-bold bg-clip-text text-transparent"
                  style={{ backgroundImage: "linear-gradient(90deg, #BE87D8 0%, #E8A0C8 100%)" }}
                >
                  30%
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </main>

      <BottomNavigation />
    </div>
  );
}
