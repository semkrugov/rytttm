"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield,
  Crown,
  Bell,
  Settings,
  ChevronRight,
  X,
  Check,
} from "lucide-react";
import BottomNavigation from "@/components/BottomNavigation";
import { useTelegramAuth } from "@/hooks/useTelegramAuth";
import { supabase } from "@/lib/supabase";
import { haptics } from "@/lib/telegram";
import { animationVariants } from "@/lib/animations";
import { cn } from "@/lib/utils";
import { useHasAnimated } from "@/hooks/useHasAnimated";

interface EditFieldModalProps {
  isOpen: boolean;
  onClose: () => void;
  fieldName: string;
  currentValue: string;
  onSave: (value: string) => Promise<void>;
}

function EditFieldModal({
  isOpen,
  onClose,
  fieldName,
  currentValue,
  onSave,
}: EditFieldModalProps) {
  const [value, setValue] = useState(currentValue);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setValue(currentValue);
    }
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
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-40"
          />
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            transition={{
              duration: 0.3,
              ease: [0.19, 1, 0.22, 1],
            }}
            className="fixed bottom-0 left-0 right-0 bg-[var(--tg-theme-secondary-bg-color)] rounded-t-3xl p-6 z-50"
            style={{
              paddingBottom: "calc(1.5rem + env(safe-area-inset-bottom))",
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-[var(--tg-theme-text-color)]">
                Редактировать {fieldName}
              </h3>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-[var(--tg-theme-bg-color)] transition-colors"
              >
                <X className="w-5 h-5 text-[var(--tg-theme-text-color)]" />
              </button>
            </div>

            <input
              type="text"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-[var(--tg-theme-bg-color)] text-[var(--tg-theme-text-color)] border border-[var(--tg-theme-hint-color)]/20 focus:outline-none focus:border-[var(--tg-theme-button-color)] mb-4"
              placeholder={`Введите ${fieldName.toLowerCase()}`}
              autoFocus
            />

            <button
              onClick={handleSave}
              disabled={saving || value.trim() === ""}
              className="w-full py-3 rounded-xl bg-[var(--tg-theme-button-color)] text-white font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                "Сохранение..."
              ) : (
                <>
                  <Check className="w-5 h-5" />
                  Сохранить
                </>
              )}
            </button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default function ProfilePage() {
  const { user, loading: authLoading } = useTelegramAuth();
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

      setProfileData(data);
      if (user) {
        // Обновляем локальное состояние пользователя
        setProfileData({ ...user, [field]: value.trim() || null });
      }
    } catch (error) {
      console.error(`Error updating ${field}:`, error);
      throw error;
    }
  };

  const generalItems = [
    {
      id: "notifications",
      label: "Notifications",
      icon: Bell,
    },
    {
      id: "settings",
      label: "App Settings",
      icon: Settings,
    },
    {
      id: "privacy",
      label: "Privacy & Security",
      icon: Shield,
    },
  ];

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[var(--tg-theme-bg-color)] flex items-center justify-center">
        <div className="text-[var(--tg-theme-text-color)]">Загрузка...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[var(--tg-theme-bg-color)] flex items-center justify-center">
        <div className="text-[var(--tg-theme-text-color)]">Пользователь не найден</div>
      </div>
    );
  }

  const displayName = profileData?.username
    ? `@${profileData.username}`
    : "Пользователь";
  const positionText = profileData?.position || "Должность не указана";

  return (
    <div className="min-h-screen bg-[var(--tg-theme-bg-color)]">
      <main
        className="container mx-auto px-4 py-6 pb-24"
        style={{
          paddingBottom: "calc(6rem + env(safe-area-inset-bottom))",
        }}
      >
        <motion.div
          initial={hasAnimated ? false : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.4,
            ease: [0.19, 1, 0.22, 1],
          }}
        >
          {/* Avatar & Info */}
          <div className="flex flex-col items-center mb-8">
            <div className="relative mb-4">
              {profileData?.avatar_url ? (
                <img
                  src={profileData.avatar_url}
                  alt={displayName}
                  className="w-24 h-24 rounded-full"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-[var(--tg-theme-button-color)] flex items-center justify-center">
                  <span className="text-3xl font-bold text-white">
                    {(profileData?.username || "U")[0].toUpperCase()}
                  </span>
                </div>
              )}
              {/* Badge щита поверх аватарки */}
              <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-[var(--tg-theme-button-color)] flex items-center justify-center border-4 border-[var(--tg-theme-bg-color)]">
                <Shield className="w-4 h-4 text-white" strokeWidth={2.5} />
              </div>
            </div>

            {/* Имя пользователя (кликабельное) */}
            <button
              onClick={() => {
                haptics.light();
                setEditingField("username");
              }}
              className="text-2xl font-bold text-[var(--tg-theme-text-color)] mb-2 hover:opacity-80 transition-opacity"
            >
              {displayName}
            </button>

            {/* Роль (кликабельная) */}
            <button
              onClick={() => {
                haptics.light();
                setEditingField("position");
              }}
              className="text-sm text-[var(--tg-theme-hint-color)] hover:text-[var(--tg-theme-text-color)] transition-colors"
            >
              {positionText}
            </button>
          </div>

          {/* Upgrade to Pro Banner */}
          <motion.div
            initial={hasAnimated ? false : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.3,
              delay: 0.1,
              ease: [0.19, 1, 0.22, 1],
            }}
            className="bg-gradient-to-r from-[var(--tg-theme-button-color)]/20 to-[var(--tg-theme-button-color)]/10 rounded-xl p-4 mb-6 flex items-center justify-between"
          >
            <div className="flex items-center gap-3 flex-1">
              <Crown className="w-6 h-6 text-[var(--tg-theme-button-color)]" />
              <div>
                <p className="text-sm font-semibold text-[var(--tg-theme-text-color)]">
                  Upgrade to Pro
                </p>
                <p className="text-xs text-[var(--tg-theme-hint-color)]">
                  Unlock full AI power & Analytics
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                haptics.medium();
                // TODO: Open upgrade modal
              }}
              className="px-4 py-2 rounded-lg bg-[var(--tg-theme-button-color)] text-white text-sm font-medium hover:opacity-90 transition-opacity"
            >
              Go Pro
            </button>
          </motion.div>

          {/* GENERAL Section */}
          <div className="mb-6">
            <label className="text-xs uppercase text-[var(--tg-theme-hint-color)] mb-3 block">
              GENERAL
            </label>
            <motion.div
              variants={animationVariants.staggerContainer}
              initial="initial"
              animate="animate"
              className="bg-[var(--tg-theme-secondary-bg-color)] rounded-xl overflow-hidden"
            >
              {generalItems.map((item, index) => {
                const Icon = item.icon;
                return (
                  <motion.button
                    key={item.id}
                    variants={animationVariants.staggerItem}
                    onClick={() => {
                      haptics.light();
                      // TODO: Navigate to respective pages
                    }}
                    className={cn(
                      "w-full flex items-center justify-between px-4 py-4",
                      index !== generalItems.length - 1 &&
                        "border-b border-[var(--tg-theme-bg-color)]"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <Icon
                        className="w-5 h-5 text-[var(--tg-theme-text-color)]"
                        strokeWidth={2}
                      />
                      <span className="text-sm text-[var(--tg-theme-text-color)]">
                        {item.label}
                      </span>
                    </div>
                    <ChevronRight
                      className="w-5 h-5 text-[var(--tg-theme-hint-color)]"
                      strokeWidth={2}
                    />
                  </motion.button>
                );
              })}
            </motion.div>
          </div>
        </motion.div>
      </main>

      {/* Edit Field Modal */}
      <EditFieldModal
        isOpen={editingField === "username"}
        onClose={() => setEditingField(null)}
        fieldName="имя пользователя"
        currentValue={profileData?.username || ""}
        onSave={async (value) => {
          await handleSaveField("username", value);
        }}
      />
      <EditFieldModal
        isOpen={editingField === "position"}
        onClose={() => setEditingField(null)}
        fieldName="должность"
        currentValue={profileData?.position || ""}
        onSave={async (value) => {
          await handleSaveField("position", value);
        }}
      />

      <BottomNavigation />
    </div>
  );
}
