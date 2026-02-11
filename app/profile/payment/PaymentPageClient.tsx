"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
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
  Pencil,
  Plus,
  X,
} from "lucide-react";
import AppHeader from "@/components/AppHeader";
import BottomNavigation from "@/components/BottomNavigation";
import { useLanguage } from "@/contexts/LanguageContext";
import { haptics } from "@/lib/telegram";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { useTelegramAuth } from "@/hooks/useTelegramAuth";
import { useHasAnimated } from "@/hooks/useHasAnimated";

type PaymentMethod = "card" | "phone" | "wallet";

const DEMO_HISTORY = [
  { id: "1", label: "FLOW", status: "success" as const, date: "12.01.26" },
  { id: "2", label: "SYNC", status: null, date: "" },
  { id: "3", label: "SYNC", status: null, date: "" },
];

type TeamContact = {
  id: string;
  name: string;
  avatarUrl?: string | null;
  color: string;
};

const FALLBACK_COLORS = [
  "bg-[#FF7E5F]",
  "bg-[#FACC15]",
  "bg-[#6CC2FF]",
  "bg-[#BE87D8]",
  "bg-[#34D399]",
];

function getFallbackColor(seed: string): string {
  const sum = seed.split("").reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  return FALLBACK_COLORS[sum % FALLBACK_COLORS.length];
}

const MOCK_MEMBERS: TeamContact[] = [
  { id: "demo-anna", name: "Anna_designer", color: "bg-[#FF7E5F]", avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Anna" },
  { id: "demo-god", name: "Godofprogramming", color: "bg-[#FACC15]" },
  { id: "demo-smm", name: "SMM_King", color: "bg-[#6CC2FF]" },
  { id: "demo-elena", name: "Elena_PM", color: "bg-[#BE87D8]" },
];

const REFERRAL_URL = "https://rytttm.com/van_tolk";

export default function PaymentPageClient() {
  const router = useRouter();
  const { t } = useLanguage();
  const hasAnimated = useHasAnimated();
  const { user, isDemoMode } = useTelegramAuth();
  const [method, setMethod] = useState<PaymentMethod>("card");
  const [autoPay, setAutoPay] = useState(false);
  const [showRolesInfo, setShowRolesInfo] = useState(false);
  const [showMemberSelect, setShowMemberSelect] = useState(false);
  const [selectionType, setSelectionType] = useState<"full" | "member">("full");
  const [contacts, setContacts] = useState<TeamContact[]>(MOCK_MEMBERS);
  const [fullAccessIds, setFullAccessIds] = useState<string[]>(["demo-anna"]);
  const [memberAccessIds, setMemberAccessIds] = useState<string[]>([]);

  const contactById = useMemo(
    () => new Map(contacts.map((contact) => [contact.id, contact])),
    [contacts]
  );

  useEffect(() => {
    let cancelled = false;

    const loadSharedContacts = async () => {
      if (isDemoMode || !user?.id) {
        if (!cancelled) {
          setContacts(MOCK_MEMBERS);
          setFullAccessIds((prev) => (prev.length > 0 ? prev : ["demo-anna"]));
        }
        return;
      }

      try {
        const { data: myMemberships, error: membershipsError } = await supabase
          .from("project_members")
          .select("project_id")
          .eq("user_id", user.id);

        if (membershipsError) throw membershipsError;

        const projectIds = Array.from(
          new Set((myMemberships || []).map((row: { project_id: string }) => row.project_id))
        );

        if (projectIds.length === 0) {
          if (!cancelled) {
            setContacts([]);
            setFullAccessIds([]);
            setMemberAccessIds([]);
          }
          return;
        }

        const { data: sharedMembers, error: sharedMembersError } = await supabase
          .from("project_members")
          .select("user_id, profiles(username, avatar_url)")
          .in("project_id", projectIds)
          .neq("user_id", user.id);

        if (sharedMembersError) throw sharedMembersError;

        const uniqueContacts = new Map<string, TeamContact>();

        (sharedMembers || []).forEach(
          (row: {
            user_id: string;
            profiles?:
              | { username: string | null; avatar_url: string | null }
              | Array<{ username: string | null; avatar_url: string | null }>
              | null;
          }) => {
            if (uniqueContacts.has(row.user_id)) return;
            const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
            const username = profile?.username || "User";
            uniqueContacts.set(row.user_id, {
              id: row.user_id,
              name: username,
              avatarUrl: profile?.avatar_url || null,
              color: getFallbackColor(row.user_id),
            });
          }
        );

        const loadedContacts = Array.from(uniqueContacts.values()).sort((a, b) =>
          a.name.localeCompare(b.name)
        );

        if (!cancelled) {
          setContacts(loadedContacts);

          const allowed = new Set(loadedContacts.map((contact) => contact.id));
          setFullAccessIds((prev) => prev.filter((id) => allowed.has(id)));
          setMemberAccessIds((prev) => prev.filter((id) => allowed.has(id)));

          if (loadedContacts.length > 0) {
            setFullAccessIds((prev) => (prev.length > 0 ? prev : [loadedContacts[0].id]));
          }
        }
      } catch (error) {
        console.error("Failed to load shared contacts for payment roles:", error);
        if (!cancelled) {
          setContacts([]);
        }
      }
    };

    void loadSharedContacts();

    return () => {
      cancelled = true;
    };
  }, [isDemoMode, user?.id]);

  const toggleMemberSelection = (id: string) => {
    haptics.selection();
    const setIds = selectionType === "full" ? setFullAccessIds : setMemberAccessIds;
    setIds((prev) => 
      prev.includes(id) ? prev.filter(mid => mid !== id) : [...prev, id]
    );
  };

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
              className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center active:opacity-80 transition-opacity"
            >
              <ArrowLeft className="w-5 h-5 text-[#151617]" strokeWidth={2} />
            </button>
          }
        />

        <motion.div
          initial={hasAnimated ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={
            hasAnimated ? { duration: 0 } : { duration: 0.3, ease: [0.19, 1, 0.22, 1] }
          }
          className="pt-2"
        >
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-[22px] font-bold text-white">{t("payment.title")}</h1>
            <button
              type="button"
              onClick={() => {
                haptics.light();
                router.push("/profile/payment/tariffs");
              }}
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
            <motion.div className="flex gap-2 p-1 rounded-[12px] bg-[#1E1F22]" initial={false}>
              {(
                [
                  { id: "card" as const, key: "payment.card", icon: CreditCard },
                  { id: "phone" as const, key: "payment.phone", icon: Smartphone },
                  { id: "wallet" as const, key: "payment.wallet", icon: Wallet },
                ] as const
              ).map(({ id, key, icon: Icon }) => (
                <motion.button
                  key={id}
                  type="button"
                  onClick={() => {
                    haptics.light();
                    setMethod(id);
                  }}
                  className={cn(
                    "relative z-10 flex-1 flex items-center justify-center gap-2 py-2.5 rounded-[10px] text-[14px] font-medium transition-colors",
                    method === id ? "text-white" : "text-[#9097A7]"
                  )}
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                >
                  <Icon className="w-4 h-4" />
                  {t(key)}
                  {method === id && (
                    <motion.div
                      layoutId="activePaymentMethodTab"
                      className="absolute inset-0 rounded-[10px] -z-10"
                      style={{
                        background: "linear-gradient(90deg, #C3CBFF 0%, #F6B3FF 100%)",
                      }}
                      initial={false}
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}
                </motion.button>
              ))}
            </motion.div>

            {method === "phone" && (
              <div className="mt-4 rounded-[14px] bg-[#1E1F22] p-4">
                <label className="text-[11px] font-medium uppercase tracking-wider text-[#9097A7] block mb-1">
                  {t("payment.number")}
                </label>
                <div className="flex items-center gap-2 rounded-[10px] bg-[#28292D] px-4 py-3">
                  <input
                    type="tel"
                    placeholder="+7 999 999 99 99"
                    className="flex-1 min-w-0 bg-transparent text-white text-[15px] outline-none placeholder:text-[#585B62]"
                  />
                  <button 
                    type="button"
                    className="w-6 h-6 rounded-full border border-[#6CC2FF] flex items-center justify-center text-[#6CC2FF]"
                  >
                    <Pencil className="w-3 h-3" />
                  </button>
                </div>
              </div>
            )}

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

          {/* Team and Roles */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-[11px] font-medium uppercase tracking-wider text-[#9097A7]">
                {t("payment.teamAndRoles")}
              </h2>
              <button onClick={() => setShowRolesInfo(true)} type="button">
                <Info className="w-4 h-4 text-[#9097A7]" strokeWidth={2} />
              </button>
            </div>
            <div className="rounded-[14px] bg-[#1E1F22] overflow-hidden">
              {/* Row 1: Full Access */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-[#28292D]">
                <span className="text-[15px] font-medium text-white">{t("payment.fullAccess")}</span>
                <div className="flex items-center gap-3">
                  <div className="flex items-center -space-x-2">
                    {fullAccessIds.map(id => {
                      const m = contactById.get(id);
                      if (!m) return null;
                      return m.avatarUrl ? (
                        <img key={id} src={m.avatarUrl} alt="" className="w-8 h-8 rounded-full object-cover border-2 border-[#1E1F22] z-10" />
                      ) : (
                        <div key={id} className={cn("w-8 h-8 rounded-full flex items-center justify-center text-[#151617] text-xs font-bold border-2 border-[#1E1F22] z-10", m.color)}>
                          {m.name[0]}
                        </div>
                      );
                    })}
                  </div>
                  <button 
                    type="button"
                    onClick={() => {
                      haptics.light();
                      setSelectionType("full");
                      setShowMemberSelect(true);
                    }}
                    className="w-8 h-8 rounded-full border border-[#6CC2FF] flex items-center justify-center text-[#6CC2FF]"
                  >
                    <Plus className="w-4 h-4" strokeWidth={2.5} />
                  </button>
                </div>
              </div>
              
              {/* Row 2: Member Access */}
              <div className="flex items-center justify-between px-4 py-3">
                <span className="text-[15px] font-medium text-white">{t("payment.memberAccess")}</span>
                <div className="flex items-center gap-3">
                  <div className="flex items-center -space-x-2">
                    {memberAccessIds.map(id => {
                      const m = contactById.get(id);
                      if (!m) return null;
                      return m.avatarUrl ? (
                        <img key={id} src={m.avatarUrl} alt="" className="w-8 h-8 rounded-full object-cover border-2 border-[#1E1F22] z-10" />
                      ) : (
                        <div key={id} className={cn("w-8 h-8 rounded-full flex items-center justify-center text-[#151617] text-xs font-bold border-2 border-[#1E1F22] z-10", m.color)}>
                          {m.name[0]}
                        </div>
                      );
                    })}
                  </div>
                  <button 
                    type="button"
                    onClick={() => {
                      haptics.light();
                      setSelectionType("member");
                      setShowMemberSelect(true);
                    }}
                    className="w-8 h-8 rounded-full border border-[#6CC2FF] flex items-center justify-center text-[#6CC2FF]"
                  >
                    <Plus className="w-4 h-4" strokeWidth={2.5} />
                  </button>
                </div>
              </div>
            </div>
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

      {/* Roles Info Modal */}
      <AnimatePresence>
        {showRolesInfo && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowRolesInfo(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed bottom-0 left-0 right-0 z-50 bg-[#1E1F22] rounded-t-[20px] max-h-[85vh] overflow-hidden shadow-xl"
              style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
            >
              <div className="flex items-center justify-between px-4 py-4 border-b border-[#28292D] flex-shrink-0">
                <h3 className="text-[20px] font-bold text-white">{t("payment.roles.title")}</h3>
                <button
                  onClick={() => setShowRolesInfo(false)}
                  className="w-8 h-8 rounded-full bg-[#28292D] flex items-center justify-center text-[#9097A7]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="overflow-y-auto max-h-[calc(85vh-72px)] px-5 py-5">
                <p className="text-[14px] text-[#9097A7] leading-relaxed mb-6">
                  {t("payment.roles.desc")}
                </p>

                <div className="space-y-6">
                  {/* Member */}
                  <div>
                    <div className="flex items-baseline gap-2 mb-2">
                      <h4 className="text-[16px] font-bold text-white">{t("payment.roles.member")}</h4>
                      <span className="text-[13px] text-[#585B62]">{t("payment.roles.memberSub")}</span>
                    </div>
                    <ul className="space-y-2">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="block w-1 h-1 rounded-full bg-white mt-2 flex-shrink-0" />
                          <span className="text-[14px] text-[#CCCCCC] leading-snug">
                            {t(`payment.roles.member.${i}`)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Manager */}
                  <div>
                    <div className="flex items-baseline gap-2 mb-2">
                      <h4 className="text-[16px] font-bold text-white">{t("payment.roles.manager")}</h4>
                      <span className="text-[13px] text-[#585B62]">{t("payment.roles.managerSub")}</span>
                    </div>
                    <p className="text-[14px] text-white mb-2">{t("payment.roles.manager.desc")}</p>
                    <ul className="space-y-2">
                      {[1, 2, 3].map((i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="block w-1 h-1 rounded-full bg-white mt-2 flex-shrink-0" />
                          <span className="text-[14px] text-[#CCCCCC] leading-snug">
                            {t(`payment.roles.manager.${i}`)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Member Selection Bottom Sheet */}
      <AnimatePresence>
        {showMemberSelect && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/60 z-50"
              onClick={() => setShowMemberSelect(false)}
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed bottom-0 left-0 right-0 z-50 bg-[#1E1F22] rounded-t-[20px] max-h-[70vh] overflow-hidden"
              style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
            >
              <div className="flex items-center justify-between px-4 py-4 border-b border-[#28292D]">
                <h3 className="text-white font-semibold text-[18px]">{t("payment.selectMembers")}</h3>
                <button
                  onClick={() => setShowMemberSelect(false)}
                  className="w-8 h-8 rounded-full bg-[#28292D] flex items-center justify-center"
                >
                  <X className="w-4 h-4 text-[#9097A7]" />
                </button>
              </div>
              
              <div className="overflow-y-auto max-h-[calc(70vh-60px)] pb-20">
                <div className="divide-y divide-[#28292D]">
                  {contacts.map((member) => {
                    const currentSelected = selectionType === "full" ? fullAccessIds : memberAccessIds;
                    const isSelected = currentSelected.includes(member.id);
                    return (
                      <button
                        key={member.id}
                        onClick={() => toggleMemberSelection(member.id)}
                        className="w-full flex items-center gap-3 px-4 py-4 text-left active:bg-[#28292D] transition-colors"
                      >
                        {member.avatarUrl ? (
                          <img src={member.avatarUrl} alt="" className="w-12 h-12 rounded-full object-cover" />
                        ) : (
                          <div className={cn("w-12 h-12 rounded-full flex items-center justify-center text-[#151617] font-bold text-[16px]", member.color)}>
                            {member.name[0].toUpperCase()}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="text-[16px] font-medium text-white">{member.name}</div>
                        </div>
                        
                        {/* Selection Indicator */}
                        <div className={cn(
                          "w-6 h-6 rounded-full flex-shrink-0 transition-all duration-200",
                          isSelected 
                            ? "bg-gradient-to-r from-[#D4C4F7] to-[#E8A0C8] shadow-[0_0_10px_rgba(212,196,247,0.5)]" 
                            : "bg-[#3F4044]"
                        )} />
                      </button>
                    );
                  })}
                  {contacts.length === 0 && (
                    <div className="px-4 py-5 text-sm text-[#9097A7]">
                      Контактов пока нет. Контакты появятся после участия в общих проектах/чатах.
                    </div>
                  )}
                </div>
              </div>

              {/* Save Button */}
              <div className="absolute bottom-0 left-0 right-0 p-4 bg-[#1E1F22] border-t border-[#28292D]">
                <button
                  onClick={() => {
                    haptics.success();
                    setShowMemberSelect(false);
                  }}
                  className="w-full py-3 rounded-[14px] bg-[#6CC2FF] text-[#151617] font-bold text-[16px]"
                >
                  {t("profile.save")}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
