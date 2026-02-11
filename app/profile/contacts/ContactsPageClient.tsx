"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Search,
  UserPlus,
  Palette,
  Monitor,
  Laptop,
  Smile,
  FolderPlus,
} from "lucide-react";
import AppHeader from "@/components/AppHeader";
import BottomNavigation from "@/components/BottomNavigation";
import { useLanguage } from "@/contexts/LanguageContext";
import { haptics } from "@/lib/telegram";
import { cn } from "@/lib/utils";
import { useHasAnimated } from "@/hooks/useHasAnimated";

const BOT_INVITE_URL =
  typeof process !== "undefined" && process.env.NEXT_PUBLIC_BOT_INVITE_URL
    ? process.env.NEXT_PUBLIC_BOT_INVITE_URL
    : "https://t.me/rytttm_bot";

interface Contact {
  id: string;
  username: string;
  avatarUrl?: string | null;
  initial?: string;
  online?: boolean;
  /** Tailwind gradient for avatar placeholder, e.g. "from-[#BE87D8] to-[#9B6BB8]" */
  avatarGradient?: string;
}

const DEMO_CONTACTS: Contact[] = [
  {
    id: "anna",
    username: "Anna_designer",
    avatarUrl: null,
    initial: "A",
    online: true,
    avatarGradient: "from-[#9BE1FF] to-[#6CC2FF]",
  },
  {
    id: "god",
    username: "Godofprogramming",
    avatarUrl: null,
    initial: "G",
    online: false,
    avatarGradient: "from-[#FACC15] to-[#EAB308]",
  },
];

const FOLDERS: { id: string; labelKey: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "designers", labelKey: "contacts.designers", icon: Palette },
  { id: "coders", labelKey: "contacts.coders", icon: Monitor },
  { id: "freelancers", labelKey: "contacts.freelancers", icon: Laptop },
  { id: "clients", labelKey: "contacts.clients", icon: Smile },
];

export default function ContactsPageClient() {
  const router = useRouter();
  const { t } = useLanguage();
  const hasAnimated = useHasAnimated();
  const [searchQuery, setSearchQuery] = useState("");

  const filteredContacts = useMemo(() => {
    if (!searchQuery.trim()) return DEMO_CONTACTS;
    const q = searchQuery.trim().toLowerCase();
    return DEMO_CONTACTS.filter((c) => c.username.toLowerCase().includes(q));
  }, [searchQuery]);

  const shareInviteLink = async () => {
    const shareText = "Присоединяйся к rytttm в Telegram";
    const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(BOT_INVITE_URL)}&text=${encodeURIComponent(shareText)}`;

    try {
      const tgWebApp =
        typeof window !== "undefined"
          ? ((window as unknown as { Telegram?: { WebApp?: { openTelegramLink?: (url: string) => void } } }).Telegram?.WebApp ?? null)
          : null;

      if (tgWebApp?.openTelegramLink) {
        tgWebApp.openTelegramLink(shareUrl);
        haptics.success();
        return;
      }

      if (typeof window !== "undefined") {
        window.open(shareUrl, "_blank", "noopener,noreferrer");
      }
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
          <h1 className="text-[22px] font-bold text-white mb-4">{t("contacts.title")}</h1>

          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#9097A7]" strokeWidth={2} />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t("contacts.search")}
              className="w-full pl-10 pr-4 py-3 rounded-[14px] bg-[#1E1F22] text-white placeholder:text-[#9097A7] border border-transparent focus:border-[#28292D] focus:outline-none text-[15px]"
            />
          </div>

          {/* Пригласить в rytttm + список контактов */}
          <div className="rounded-[14px] bg-[#1E1F22] overflow-hidden mb-8">
            <button
              type="button"
              onClick={() => {
                haptics.light();
                shareInviteLink();
              }}
              className="w-full flex items-center gap-3 px-4 py-4 border-b border-[#28292D] text-left"
            >
              <UserPlus className="w-5 h-5 text-[#6CC2FF]" strokeWidth={2} />
              <span className="text-[15px] font-medium text-[#6CC2FF]">{t("contacts.invite")}</span>
            </button>
            {filteredContacts.map((contact, index) => (
              <button
                key={contact.id}
                type="button"
                onClick={() => haptics.light()}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-4 text-left",
                  index !== filteredContacts.length - 1 && "border-b border-[#28292D]"
                )}
              >
                <div className="relative flex-shrink-0">
                  {contact.avatarUrl ? (
                    <img
                      src={contact.avatarUrl}
                      alt=""
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div
                      className={cn(
                        "w-10 h-10 rounded-full bg-gradient-to-b flex items-center justify-center",
                        contact.avatarGradient || "from-[#28292D] to-[#1E1F22]"
                      )}
                    >
                      <span className="text-[15px] font-bold text-white">
                        {(contact.initial || contact.username).charAt(0)}
                      </span>
                    </div>
                  )}
                  {contact.online && (
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-[#22C55E] border-2 border-[#1E1F22]" />
                  )}
                </div>
                <span className="text-[15px] font-medium text-white truncate">{contact.username}</span>
              </button>
            ))}
          </div>

          {/* Папки */}
          <div>
            <h2 className="text-[11px] font-medium uppercase tracking-wider text-[#9097A7] mb-3">
              {t("contacts.folders")}
            </h2>
            <div className="rounded-[14px] bg-[#1E1F22] overflow-hidden">
              {FOLDERS.map((folder) => {
                const Icon = folder.icon;
                return (
                  <button
                    key={folder.id}
                    type="button"
                    onClick={() => haptics.light()}
                    className="w-full flex items-center gap-3 px-4 py-4 text-left border-b border-[#28292D]"
                  >
                    <Icon className="w-5 h-5 text-white" />
                    <span className="text-[15px] font-medium text-white">{t(folder.labelKey)}</span>
                  </button>
                );
              })}
              <button
                type="button"
                onClick={() => haptics.light()}
                className="w-full flex items-center gap-3 px-4 py-4 text-left"
              >
                <FolderPlus className="w-5 h-5 text-[#6CC2FF]" strokeWidth={2} />
                <span className="text-[15px] font-medium text-[#6CC2FF]">{t("contacts.addFolder")}</span>
              </button>
            </div>
          </div>
        </motion.div>
      </main>

      <BottomNavigation />
    </div>
  );
}
