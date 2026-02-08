"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Music2, Users, Headphones, ChevronDown, Sparkles, CheckSquare, BarChart3, Lightbulb, ChevronUp, CreditCard, Smartphone, Wallet, Star, Info } from "lucide-react";
import AppHeader from "@/components/AppHeader";
import { useLanguage } from "@/contexts/LanguageContext";
import { haptics } from "@/lib/telegram";
import { cn } from "@/lib/utils";

export default function TariffsPageClient() {
  const router = useRouter();
  const { t } = useLanguage();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("yearly");
  const [paymentMethod, setPaymentMethod] = useState<"card" | "phone" | "wallet" | "stars">("card");
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [autoPay, setAutoPay] = useState(false);

  const toggleExpanded = (id: string) => {
    haptics.selection();
    setExpandedId(expandedId === id ? null : id);
    setShowPaymentForm(false); // Reset form when collapsing/changing
  };

  const cards = [
    {
      id: "soundcheck",
      titleKey: "tariffs.soundcheck",
      descKey: "tariffs.soundcheck.desc",
      subKey: "tariffs.soundcheck.sub",
      priceKey: "tariffs.free",
      periodKey: "tariffs.forever",
      headerBg: "bg-white",
      headerText: "text-black",
      icon: Music2,
      badge: {
        textKey: "tariffs.current",
        bg: "bg-[#E8A0C8]",
        text: "text-white",
      },
      details: [
        {
          titleKey: "tariffs.includes",
          icon: CheckSquare,
          iconColor: "text-[#22C55E]",
          items: [
            "tariffs.soundcheck.inc.1",
            "tariffs.soundcheck.inc.2",
            "tariffs.soundcheck.inc.3",
            "tariffs.soundcheck.inc.4",
            "tariffs.soundcheck.inc.5"
          ]
        },
        {
          titleKey: "tariffs.limitations",
          icon: BarChart3,
          iconColor: "text-[#F87171]", // Soft red/orange
          items: [
            "tariffs.soundcheck.lim.1",
            "tariffs.soundcheck.lim.2",
            "tariffs.soundcheck.lim.3",
            "tariffs.soundcheck.lim.4"
          ]
        },
        {
          titleKey: "tariffs.forWhom",
          icon: Lightbulb,
          iconColor: "text-[#FACC15]", // Yellow
          items: [
            "tariffs.soundcheck.who.1",
            "tariffs.soundcheck.who.2",
            "tariffs.soundcheck.who.3",
            "tariffs.soundcheck.who.4",
            "tariffs.soundcheck.who.5",
            "tariffs.soundcheck.who.6",
            "tariffs.soundcheck.who.7",
            "tariffs.soundcheck.who.8"
          ]
        }
      ]
    },
    {
      id: "groove",
      titleKey: "tariffs.groove",
      descKey: "tariffs.groove.desc",
      subKey: "tariffs.groove.sub",
      price: "920 ₽",
      priceColor: "text-[#BE87D8]",
      period: "/ месяц*",
      headerBg: "bg-[#D4C4F7]",
      headerText: "text-black",
      icon: Users,
      badge: {
        textKey: "tariffs.popular",
        bg: "bg-white",
        text: "text-black",
        icon: Sparkles,
      },
      details: [
        {
          titleKey: "tariffs.includes.groove",
          icon: CheckSquare,
          iconColor: "text-[#22C55E]",
          items: [
            "tariffs.groove.inc.1",
            "tariffs.groove.inc.2",
            "tariffs.groove.inc.3",
            "tariffs.groove.inc.4",
            "tariffs.groove.inc.5",
            "tariffs.groove.inc.6",
            "tariffs.groove.inc.7",
            "tariffs.groove.inc.8"
          ]
        },
        {
          titleKey: "tariffs.limitations",
          icon: BarChart3,
          iconColor: "text-[#F87171]",
          items: [
            "tariffs.groove.lim.1",
            "tariffs.groove.lim.2",
            "tariffs.groove.lim.3",
            "tariffs.groove.lim.4",
            "tariffs.groove.lim.5",
            "tariffs.groove.lim.6",
            "tariffs.groove.lim.7"
          ]
        },
        {
          titleKey: "tariffs.forWhom",
          icon: Lightbulb,
          iconColor: "text-[#FACC15]",
          items: [
            "tariffs.groove.who.1",
            "tariffs.groove.who.2",
            "tariffs.groove.who.3",
            "tariffs.groove.who.4",
            "tariffs.groove.who.5"
          ]
        }
      ],
      hasPayment: true,
      billingConfig: {
        monthly: { price: "1 150 ₽", period: "/ месяц" },
        yearly: { price: "920 ₽", period: "/ месяц", fullPrice: "13 800 ₽", discountPrice: "11 000 ₽", save: "2 800 ₽" }
      }
    },
    {
      id: "production",
      titleKey: "tariffs.production",
      descKey: "tariffs.production.desc",
      subKey: "tariffs.production.sub",
      price: "1 870 ₽",
      priceColor: "text-[#FF7E5F]",
      period: "/ месяц*",
      headerBg: "bg-gradient-to-r from-[#FF7E5F] to-[#FEB47B]", // Orange gradient
      headerText: "text-[#151617]",
      icon: Headphones,
      badge: null,
      details: [
        {
          titleKey: "tariffs.includes.production",
          icon: CheckSquare,
          iconColor: "text-[#22C55E]",
          items: [
            "tariffs.production.inc.1",
            "tariffs.production.inc.2",
            "tariffs.production.inc.3",
            "tariffs.production.inc.4" // Nested items handled below? No, I'll assume flat list or special handling.
            // Screenshot has nested list. I'll just flatten them or add them as items for now.
            // Or I can update the rendering logic to support nested items.
            // For now, flat list of keys.
          ]
        },
        {
           // Special section for Analytics sub-items?
           // I'll cheat and just add the sub-items as items.
           titleKey: "tariffs.limitations",
           icon: BarChart3,
           iconColor: "text-[#F87171]",
           items: [
             "tariffs.production.lim.1",
             "tariffs.production.lim.2",
             "tariffs.production.lim.3"
           ]
        },
        {
          titleKey: "tariffs.forWhom",
          icon: Lightbulb,
          iconColor: "text-[#FACC15]",
          items: [
            "tariffs.production.who.1",
            "tariffs.production.who.2",
            "tariffs.production.who.3",
            "tariffs.production.who.4",
            "tariffs.production.who.5",
            "tariffs.production.who.6"
          ]
        }
      ],
      hasPayment: true,
      buttonGradient: "bg-gradient-to-r from-[#FF7E5F] to-[#FEB47B]",
      billingConfig: {
        monthly: { price: "2 490 ₽", period: "/ месяц" },
        yearly: { price: "1 870 ₽", period: "/ месяц", fullPrice: "29 880 ₽", discountPrice: "22 410 ₽", save: "7 470 ₽" }
      }
    },
  ];

  return (
    <div className="min-h-screen bg-[rgba(35,36,39,1)]">
      <main
        className="mx-auto max-w-[390px] px-[18px] py-6 pb-12"
        style={{ paddingBottom: "calc(3rem + env(safe-area-inset-bottom))" }}
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
          title={t("tariffs.title")}
        />

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.19, 1, 0.22, 1] }}
          className="mt-6 space-y-4"
        >
          {cards.map((card) => (
            <div
              key={card.id}
              className="overflow-hidden rounded-[24px] bg-[#1E1F22]"
            >
              {/* Header */}
              <div
                className={cn(
                  "relative px-5 py-4 flex items-center justify-between",
                  card.headerBg
                )}
              >
                <div className="flex items-center gap-2.5">
                  <card.icon className={cn("w-5 h-5", card.headerText)} strokeWidth={2.5} />
                  <span className={cn("text-[17px] font-bold tracking-wide uppercase", card.headerText)}>
                    {t(card.titleKey)}
                  </span>
                </div>
                {card.badge && (
                  <div
                    className={cn(
                      "flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wider shadow-sm",
                      card.badge.bg,
                      card.badge.text
                    )}
                  >
                    {card.badge.icon && <card.badge.icon className="w-3 h-3 text-[#FFD700] fill-[#FFD700]" />}
                    {t(card.badge.textKey)}
                  </div>
                )}
              </div>

              {/* Body */}
              <div className="p-5 pt-4">
                <h3 className="text-[20px] leading-tight font-bold text-white mb-1.5">
                  {t(card.descKey)}
                </h3>
                <p className="text-[15px] text-[#9097A7] mb-6">
                  {t(card.subKey)}
                </p>

                <AnimatePresence initial={false}>
                  {expandedId === card.id && card.details && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: [0.19, 1, 0.22, 1] }}
                      className="overflow-hidden"
                    >
                      <div className="space-y-4 pb-6">
                        {card.details.map((section, idx) => (
                          <div key={idx} className="rounded-[16px] bg-[#28292D] p-4">
                            <div className="flex items-center gap-2 mb-3">
                              <section.icon className={cn("w-5 h-5", section.iconColor)} strokeWidth={2.5} />
                              <h4 className="text-[15px] font-bold text-white">
                                {t(section.titleKey)}
                              </h4>
                            </div>
                            <ul className="space-y-2">
                              {section.items.map((itemKey, i) => (
                                <li key={i} className="flex items-start gap-2">
                                  <span className="block w-1 h-1 rounded-full bg-[#9097A7] mt-2 flex-shrink-0" />
                                  <span className="text-[14px] text-white leading-snug">
                                    {t(itemKey)}
                                  </span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Show default price only if NOT expanded OR (expanded but no payment options) */}
                {(!expandedId || expandedId !== card.id || !card.hasPayment) && (
                  <div className="flex items-baseline gap-2 mb-6">
                    <span className={cn("text-[32px] font-bold", card.priceColor || "text-white")}>
                      {card.price || (card.priceKey && t(card.priceKey))}
                    </span>
                    <span className="text-[15px] text-[#9097A7]">
                      {card.period || (card.periodKey && t(card.periodKey))}
                    </span>
                  </div>
                )}

                {/* Payment UI for expanded paid cards */}
                <AnimatePresence>
                  {expandedId === card.id && card.hasPayment && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-6"
                    >
                      {/* Billing Cycle */}
                      <div className="space-y-3 mb-8">
                        {/* Monthly */}
                        <div 
                          onClick={() => { haptics.selection(); setBillingCycle("monthly"); }}
                          className="flex items-center justify-between cursor-pointer"
                        >
                          <div className="flex items-center gap-3">
                            <div className={cn(
                              "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors",
                              billingCycle === "monthly" ? "border-white bg-white" : "border-[#9097A7]"
                            )}>
                              {billingCycle === "monthly" && <div className="w-2.5 h-2.5 rounded-full bg-black" />}
                            </div>
                            <span className="text-[15px] font-medium text-white">{t("billing.monthly")}</span>
                          </div>
                          <div className="flex items-baseline gap-1.5">
                            <span className="text-[20px] font-bold text-white">
                              {card.billingConfig?.monthly.price}
                            </span>
                            <span className="text-[13px] text-[#9097A7]">
                              {t("billing.year").replace("/ год", "/ месяц")} 
                              {/* Using simple replace or just t key if exact match */}
                            </span>
                          </div>
                        </div>

                        {/* Yearly */}
                        <div 
                          onClick={() => { haptics.selection(); setBillingCycle("yearly"); }}
                          className="flex items-start justify-between cursor-pointer"
                        >
                          <div className="flex items-center gap-3 mt-1">
                            <div className={cn(
                              "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors",
                              billingCycle === "yearly" ? "border-white bg-white" : "border-[#9097A7]"
                            )}>
                              {billingCycle === "yearly" && <div className="w-2.5 h-2.5 rounded-full bg-black" />}
                            </div>
                            <span className="text-[15px] font-medium text-white">{t("billing.yearly")}</span>
                          </div>
                          <div className="flex flex-col items-end">
                            <div className="flex items-baseline gap-1.5">
                              <span className="text-[20px] font-bold text-white">
                                {card.billingConfig?.yearly.price}
                              </span>
                              <span className="text-[13px] text-[#9097A7]">
                                / месяц
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="text-[13px] text-[#9097A7] line-through">
                                {card.billingConfig?.yearly.fullPrice}
                              </span>
                              <span className="text-[13px] font-bold text-white">
                                {card.billingConfig?.yearly.discountPrice}
                              </span>
                              <span className="text-[13px] text-[#9097A7]">
                                {t("billing.year")}
                              </span>
                            </div>
                            <span className="text-[11px] text-[#9097A7] mt-0.5">
                              {t("billing.save")} {card.billingConfig?.yearly.save} (~20%)
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Payment Method */}
                      <div className="mb-8">
                        <label className="text-[11px] font-medium uppercase tracking-wider text-[#585B62] block mb-3">
                          {t("tariffs.paymentMethod")}
                        </label>
                        <div className="space-y-3">
                          {[
                            { id: "card", icon: CreditCard, label: "billing.methods.card" },
                            { id: "phone", icon: Smartphone, label: "billing.methods.phone" },
                            { id: "wallet", icon: Wallet, label: "billing.methods.wallet" },
                            { id: "stars", icon: Star, label: "billing.methods.stars" }
                          ].map((m) => (
                             <div 
                               key={m.id}
                               onClick={() => { haptics.selection(); setPaymentMethod(m.id as any); }}
                               className="flex items-center gap-3 cursor-pointer"
                             >
                               <div className={cn(
                                 "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors",
                                 paymentMethod === m.id ? "border-white bg-white" : "border-[#9097A7]"
                               )}>
                                 {paymentMethod === m.id && <div className="w-2.5 h-2.5 rounded-full bg-black" />}
                               </div>
                               <m.icon className="w-5 h-5 text-[#6CC2FF]" strokeWidth={1.5} />
                               <span className="text-[15px] font-medium text-[#6CC2FF]">
                                 {t(m.label)}
                               </span>
                             </div>
                          ))}
                        </div>
                      </div>

                      {/* Pay Button */}
                      {!showPaymentForm ? (
                        <button
                          type="button"
                          onClick={() => {
                            haptics.medium();
                            setShowPaymentForm(true);
                          }}
                          className={cn(
                            "w-full py-3.5 rounded-[14px] text-[#151617] text-[16px] font-bold shadow-lg active:scale-[0.98] transition-transform",
                            (card as any).buttonGradient || "bg-gradient-to-r from-[#D4C4F7] to-[#E8A0C8]"
                          )}
                        >
                          {t("tariffs.pay")}
                        </button>
                      ) : (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          className="space-y-4"
                        >
                          <div className="bg-[#28292D] rounded-[14px] p-4">
                            <label className="text-[11px] font-medium uppercase tracking-wider text-[#9097A7] block mb-2">
                              {t("payment.totalToPay")}
                            </label>
                            <div className="text-[24px] font-bold text-white mb-4">
                              {billingCycle === "monthly" 
                                ? card.billingConfig?.monthly.price 
                                : card.billingConfig?.yearly.discountPrice}
                            </div>
                            
                            {/* Card Form Stub */}
                            <div className="space-y-3">
                              <div>
                                <label className="text-[11px] font-medium uppercase tracking-wider text-[#9097A7] block mb-1">
                                  {t("payment.number")}
                                </label>
                                <div className="flex items-center gap-2 px-4 py-3 rounded-[10px] bg-[#1E1F22] border border-[#3F4044]">
                                  <input type="text" placeholder="•••• •••• •••• 0000" className="flex-1 bg-transparent text-white outline-none placeholder:text-[#585B62]" />
                                  <span className="text-[10px] font-bold text-[#00D68F] border border-[#00D68F] px-1 rounded">МИР</span>
                                </div>
                              </div>
                              <div className="flex gap-3">
                                <div className="flex-1">
                                  <label className="text-[11px] font-medium uppercase tracking-wider text-[#9097A7] block mb-1">
                                    {t("payment.expiry")}
                                  </label>
                                  <div className="px-4 py-3 rounded-[10px] bg-[#1E1F22] border border-[#3F4044]">
                                    <input type="text" placeholder="12 / 30" className="w-full bg-transparent text-white outline-none placeholder:text-[#585B62]" />
                                  </div>
                                </div>
                                <div className="w-24">
                                  <label className="text-[11px] font-medium uppercase tracking-wider text-[#9097A7] block mb-1">
                                    {t("payment.cvv")}
                                  </label>
                                  <div className="flex items-center gap-2 px-4 py-3 rounded-[10px] bg-[#1E1F22] border border-[#3F4044]">
                                    <div className="flex gap-1">
                                      <div className="w-1.5 h-1.5 rounded-full bg-white" />
                                      <div className="w-1.5 h-1.5 rounded-full bg-white" />
                                      <div className="w-1.5 h-1.5 rounded-full bg-white" />
                                    </div>
                                    <CreditCard className="w-4 h-4 text-[#9097A7] ml-auto" />
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Auto Pay Checkbox */}
                            <div className="flex items-center gap-2 mt-4 cursor-pointer" onClick={() => setAutoPay(!autoPay)}>
                              <div className={cn("w-5 h-5 rounded border-2 flex items-center justify-center transition-colors", autoPay ? "bg-[#BE87D8] border-[#BE87D8]" : "border-[#9097A7]")}>
                                {autoPay && <ChevronDown className="w-3 h-3 text-white" />}
                              </div>
                              <span className="text-[13px] text-white">{t("payment.autoPay")}</span>
                            </div>

                            {/* Pay Button */}
                            <button
                              type="button"
                              onClick={() => haptics.success()}
                              className="w-full mt-4 py-3.5 rounded-[14px] bg-[#22C55E] text-[#151617] text-[16px] font-bold shadow-lg active:scale-[0.98] transition-transform"
                            >
                              {t("payment.payTotal")}
                            </button>
                            
                            <div className="flex items-start gap-1.5 mt-3">
                              <Info className="w-3 h-3 text-[#585B62] mt-0.5 flex-shrink-0" />
                              <p className="text-[10px] text-[#585B62] leading-tight">
                                {t("payment.secureInfo")}
                              </p>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
                
                {/* Spacer if expanded */}
                {expandedId === card.id && <div className="h-6" />}

                <button
                  type="button"
                  onClick={() => toggleExpanded(card.id)}
                  className="w-full flex items-center justify-center gap-1 text-[14px] font-medium text-[#6CC2FF] active:opacity-70 transition-opacity"
                >
                  {expandedId === card.id ? t("tariffs.hide") : t("tariffs.details")}
                  {expandedId === card.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
              </div>
            </div>
          ))}
        </motion.div>
      </main>
    </div>
  );
}
