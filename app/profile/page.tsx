"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield,
  Bell,
  ChevronRight,
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
                <Icon className="w-5 h-5 text-[#6CC2FF]" />
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
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState(user);
  const [editFirstName, setEditFirstName] = useState(profileData?.first_name || "");
  const [editLastName, setEditLastName] = useState(profileData?.last_name || "");
  const [editPosition, setEditPosition] = useState(profileData?.position || "");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setProfileData(user);
  }, [user]);

  useEffect(() => {
    if (isEditing) {
      setEditFirstName(profileData?.first_name || "");
      setEditLastName(profileData?.last_name || "");
      setEditPosition(profileData?.position || "");
    }
  }, [isEditing, profileData?.first_name, profileData?.last_name, profileData?.position]);

  const handleSaveProfile = async (data: { first_name: string; last_name: string; position: string }) => {
    if (!user) return;
    try {
      const { data: updated, error } = await supabase
        .from("profiles")
        .update({
          first_name: data.first_name.trim() || null,
          last_name: data.last_name.trim() || null,
          position: data.position.trim() || null,
        })
        .eq("id", user.id)
        .select()
        .single();
      if (error) throw error;
      setProfileData({ ...user, ...updated });
    } catch (error) {
      console.error("Error saving profile:", error);
      throw error;
    }
  };

  const handleInlineSave = async () => {
    setSaving(true);
    try {
      await handleSaveProfile({
        first_name: editFirstName,
        last_name: editLastName,
        position: editPosition,
      });
      haptics.success();
      setIsEditing(false);
    } catch {
      // error already logged in handleSaveProfile
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    haptics.light();
    setIsEditing(false);
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

  const displayName = profileData?.first_name 
    ? `${profileData.first_name} ${profileData.last_name || ""}`.trim() 
    : (profileData?.username || t("profile.userDefault"));
  const positionText = profileData?.position || t("profile.positionDefault");

  if (!user && !isDemoMode && !authLoading) {
    return (
      <div className="min-h-screen bg-[rgba(35,36,39,1)] flex items-center justify-center">
        <div className="text-white">{t("profile.userNotFound")}</div>
      </div>
    );
  }

  const showSkeleton = authLoading;

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
          {showSkeleton ? (
            <div>
              <AppHeader />
              <div className="flex flex-col items-center mb-8 mt-4">
                <div className="w-24 h-24 rounded-full bg-[#28292D] animate-pulse mb-4" />
                <div className="h-5 w-32 bg-[#28292D] rounded mb-2 animate-pulse" />
                <div className="h-4 w-24 bg-[#28292D] rounded animate-pulse" />
              </div>
              <div className="space-y-4">
                <div className="h-20 rounded-[14px] bg-[#1E1F22] animate-pulse" />
                <div className="h-20 rounded-[14px] bg-[#1E1F22] animate-pulse" />
                <div className="h-20 rounded-[14px] bg-[#1E1F22] animate-pulse" />
              </div>
            </div>
          ) : (
            <>
              <AppHeader />

              {/* Аватар и имя / инлайн-редактирование */}
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

                <AnimatePresence mode="wait">
                  {!isEditing ? (
                    <motion.div
                      key="view"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.2, ease: [0.19, 1, 0.22, 1] }}
                      className="flex flex-col items-center w-full"
                    >
                      <div className="flex items-center justify-center gap-2 mb-1">
                        <span className="text-[22px] font-bold text-white text-center">
                          {displayName}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            haptics.light();
                            setIsEditing(true);
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
                          setIsEditing(true);
                        }}
                        className="text-[14px] text-[#9097A7] hover:text-white transition-colors"
                      >
                        {positionText}
                      </button>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="edit"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.2, ease: [0.19, 1, 0.22, 1] }}
                      className="w-full max-w-[320px] space-y-3"
                    >
                      <input
                        type="text"
                        value={editFirstName}
                        onChange={(e) => setEditFirstName(e.target.value)}
                        placeholder={t("profile.firstName")}
                        className="w-full px-4 py-3 rounded-[14px] bg-[#28292D] text-white placeholder:text-[#9097A7] outline-none text-[16px]"
                      />
                      <input
                        type="text"
                        value={editLastName}
                        onChange={(e) => setEditLastName(e.target.value)}
                        placeholder={t("profile.lastName")}
                        className="w-full px-4 py-3 rounded-[14px] bg-[#28292D] text-white placeholder:text-[#9097A7] outline-none text-[16px]"
                      />
                      <input
                        type="text"
                        value={editPosition}
                        onChange={(e) => setEditPosition(e.target.value)}
                        placeholder={t("profile.position")}
                        className="w-full px-4 py-3 rounded-[14px] bg-[#28292D] text-white placeholder:text-[#9097A7] outline-none text-[16px]"
                      />
                      <div className="flex gap-2 pt-1">
                        <button
                          type="button"
                          onClick={handleCancelEdit}
                          className="flex-1 py-3 rounded-[14px] bg-[#28292D] text-[#9097A7] font-medium text-[14px] active:opacity-80"
                        >
                          {t("profile.cancel")}
                        </button>
                        <button
                          type="button"
                          onClick={handleInlineSave}
                          disabled={saving}
                          className="flex-1 py-3 rounded-[14px] bg-[#5C6B7F] text-white font-medium text-[14px] disabled:opacity-70 active:scale-[0.98]"
                        >
                          {saving ? t("profile.saving") : t("profile.saveChanges")}
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
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
            </>
          )}
        </motion.div>
      </main>

      <BottomNavigation />
    </div>
  );
}
