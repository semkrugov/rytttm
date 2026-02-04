"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield,
  Bell,
  ChevronRight,
  X,
  Check,
  Pencil,
  Music2,
  Crosshair,
  LayoutGrid,
  Contact,
  Globe,
  CreditCard,
  MessageCircle,
  Users,
  HelpCircle,
} from "lucide-react";
import AppHeader from "@/components/AppHeader";
import BottomNavigation from "@/components/BottomNavigation";
import { useTelegramAuth } from "@/hooks/useTelegramAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/lib/supabase";
import { haptics } from "@/lib/telegram";
import { cn } from "@/lib/utils";
import { useHasAnimated } from "@/hooks/useHasAnimated";

interface EditFieldModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  placeholder: string;
  saveLabel: string;
  savingLabel: string;
  currentValue: string;
  onSave: (value: string) => Promise<void>;
}

function EditFieldModal({
  isOpen,
  onClose,
  title,
  placeholder,
  saveLabel,
  savingLabel,
  currentValue,
  onSave,
}: EditFieldModalProps) {
  const [value, setValue] = useState(currentValue);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) setValue(currentValue);
  }, [isOpen, currentValue]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(value);
      haptics.success();
      onClose();
    } catch (error) {
      console.error("Error saving field:", error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 z-50"
          />
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            transition={{ duration: 0.3, ease: [0.19, 1, 0.22, 1] }}
            className="fixed bottom-0 left-0 right-0 bg-[#1E1F22] rounded-t-[20px] p-6 z-50"
            style={{ paddingBottom: "calc(1.5rem + env(safe-area-inset-bottom))" }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">{title}</h3>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-[#28292D] flex items-center justify-center"
              >
                <X className="w-4 h-4 text-[#9097A7]" />
              </button>
            </div>
            <input
              type="text"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="w-full px-4 py-3 rounded-[14px] bg-[#28292D] text-white placeholder:text-[#9097A7] outline-none mb-4"
              placeholder={placeholder}
              autoFocus
            />
            <button
              onClick={handleSave}
              disabled={saving || value.trim() === ""}
              className="w-full py-3 rounded-[14px] bg-[#3B82F6] text-white font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? savingLabel : <><Check className="w-5 h-5" /> {saveLabel}</>}
            </button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

const APP_ITEMS = [
  { id: "records", labelKey: "profile.records", icon: Crosshair },
  { id: "widgets", labelKey: "profile.widgets", icon: LayoutGrid },
  { id: "notifications", labelKey: "profile.notifications", icon: Bell },
  { id: "contacts", labelKey: "profile.contacts", icon: Contact },
  { id: "language", labelKey: "profile.language", icon: Globe },
];

const MAIN_ITEMS = [
  { id: "payment", labelKey: "profile.payment", icon: CreditCard },
  { id: "security", labelKey: "profile.security", icon: Shield },
];

const SUPPORT_ITEMS = [
  { id: "faq", labelKey: "profile.faq", icon: HelpCircle },
  { id: "ask", labelKey: "profile.ask", icon: MessageCircle },
  { id: "community", labelKey: "profile.community", icon: Users },
];

function MenuSection({
  title,
  items,
  onItemClick,
  t,
}: {
  title: string;
  items: { id: string; labelKey: string; icon: React.ComponentType<{ className?: string }> }[];
  onItemClick: (id: string) => void;
  t: (key: string) => string;
}) {
  return (
    <div className="mb-6">
      <h3 className="text-[11px] font-medium uppercase tracking-wider text-[#9097A7] mb-3">
        {title}
      </h3>
      <div className="rounded-[14px] bg-[#1E1F22] overflow-hidden">
        {items.map((item, index) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                haptics.light();
                onItemClick(item.id);
              }}
              className={cn(
                "w-full flex items-center justify-between px-4 py-4",
                index !== items.length - 1 && "border-b border-[#28292D]"
              )}
            >
              <div className="flex items-center gap-3">
                <Icon className="w-5 h-5 text-[#6CC2FF]" strokeWidth={2} />
                <span className="text-[15px] font-medium text-white">
                  {t(item.labelKey)}
                </span>
              </div>
              <ChevronRight className="w-5 h-5 text-[#9097A7]" strokeWidth={2} />
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const router = useRouter();
  const { t } = useLanguage();
  const { user, loading: authLoading, isDemoMode } = useTelegramAuth();
  const hasAnimated = useHasAnimated();
  const [editingField, setEditingField] = useState<"username" | "position" | null>(null);
  const [profileData, setProfileData] = useState(user);

  useEffect(() => {
    setProfileData(user);
  }, [user]);

  const handleSaveField = async (field: "username" | "position", value: string) => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from("profiles")
        .update({ [field]: value.trim() || null })
        .eq("id", user.id)
        .select()
        .single();
      if (error) throw error;
      setProfileData({ ...user, ...data });
    } catch (error) {
      console.error("Error saving field:", error);
      throw error;
    }
  };

  const handleMenuItem = (id: string) => {
    if (id === "records") {
      router.push("/profile/achievements");
      return;
    }
    if (id === "notifications") {
      router.push("/profile/notifications");
      return;
    }
    if (id === "contacts") {
      router.push("/profile/contacts");
      return;
    }
    if (id === "language") {
      router.push("/profile/language");
      return;
    }
    if (id === "payment") {
      router.push("/profile/payment");
      return;
    }
    // TODO: навигация по остальным пунктам меню
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[rgba(35,36,39,1)] flex items-center justify-center">
        <div className="text-white">{t("profile.loading")}</div>
      </div>
    );
  }

  const displayName = profileData?.username || t("profile.userDefault");
  const positionText = profileData?.position || t("profile.positionDefault");

  if (!user && !isDemoMode) {
    return (
      <div className="min-h-screen bg-[rgba(35,36,39,1)] flex items-center justify-center">
        <div className="text-white">{t("profile.userNotFound")}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[rgba(35,36,39,1)]">
      <main
        className="mx-auto max-w-[390px] px-[18px] py-6 pb-24"
        style={{ paddingBottom: "calc(6rem + env(safe-area-inset-bottom))" }}
      >
        <motion.div
          initial={hasAnimated ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={hasAnimated ? { duration: 0 } : { duration: 0.35, ease: [0.19, 1, 0.22, 1] }}
        >
          <AppHeader />

          {/* Аватар и имя */}
          <div className="flex flex-col items-center mb-8">
            <div className="relative mb-4">
              {profileData?.avatar_url ? (
                <img
                  src={profileData.avatar_url}
                  alt=""
                  className="w-24 h-24 rounded-full object-cover"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-gradient-to-b from-[#9BE1FF] to-[#6CC2FF] flex items-center justify-center">
                  <span className="text-3xl font-bold text-white">
                    {(displayName || "П").charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-center gap-2 mb-1">
              <span className="text-[22px] font-bold text-white text-center">
                {displayName}
              </span>
              <button
                type="button"
                onClick={() => {
                  haptics.light();
                  setEditingField("username");
                }}
                className="w-8 h-8 rounded-full bg-[#28292D] flex items-center justify-center flex-shrink-0"
              >
                <Pencil className="w-4 h-4 text-[#9097A7]" strokeWidth={2} />
              </button>
            </div>

            <button
              type="button"
              onClick={() => {
                haptics.light();
                setEditingField("position");
              }}
              className="text-[14px] text-[#9097A7] hover:text-white transition-colors"
            >
              {positionText}
            </button>
          </div>

          {/* MVP блок */}
          <div className="rounded-[14px] bg-[#1E1F22] p-4 mb-8 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="w-10 h-10 rounded-full bg-[#BE87D8]/30 flex items-center justify-center flex-shrink-0">
                <Music2 className="w-5 h-5 text-[#BE87D8]" strokeWidth={2} />
              </div>
              <div className="min-w-0">
                <p className="text-[15px] font-semibold text-white">MVP</p>
                <p className="text-[13px] text-[#9097A7] truncate">
                  Разблокируйте все функции AI и аналитики
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => haptics.medium()}
              className="px-4 py-2 rounded-[10px] bg-[#28292D] text-[#9097A7] text-[14px] font-medium flex-shrink-0"
            >
              {t("profile.change")}
            </button>
          </div>

          <MenuSection
            title={t("profile.app")}
            items={APP_ITEMS}
            onItemClick={handleMenuItem}
            t={t}
          />

          <MenuSection
            title={t("profile.main")}
            items={MAIN_ITEMS}
            onItemClick={handleMenuItem}
            t={t}
          />

          <MenuSection
            title={t("profile.support")}
            items={SUPPORT_ITEMS}
            onItemClick={handleMenuItem}
            t={t}
          />
        </motion.div>
      </main>

      <EditFieldModal
        isOpen={editingField === "username"}
        onClose={() => setEditingField(null)}
        title={t("profile.editField", { field: t("profile.fieldUsername") })}
        placeholder={t("profile.enterField", { field: t("profile.fieldUsername") })}
        saveLabel={t("profile.save")}
        savingLabel={t("profile.saving")}
        currentValue={profileData?.username || ""}
        onSave={async (value) => handleSaveField("username", value)}
      />
      <EditFieldModal
        isOpen={editingField === "position"}
        onClose={() => setEditingField(null)}
        title={t("profile.editField", { field: t("profile.fieldPosition") })}
        placeholder={t("profile.enterField", { field: t("profile.fieldPosition") })}
        saveLabel={t("profile.save")}
        savingLabel={t("profile.saving")}
        currentValue={profileData?.position || ""}
        onSave={async (value) => handleSaveField("position", value)}
      />

      <BottomNavigation />
    </div>
  );
}
