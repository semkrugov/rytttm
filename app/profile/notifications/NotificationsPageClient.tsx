"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import AppHeader from "@/components/AppHeader";
import BottomNavigation from "@/components/BottomNavigation";
import { useLanguage } from "@/contexts/LanguageContext";
import { haptics } from "@/lib/telegram";
import { cn } from "@/lib/utils";

const NOTIFICATION_ITEMS: { id: keyof NotificationState; labelKey: string }[] = [
  { id: "newTask", labelKey: "notifications.newTask" },
  { id: "changeInTask", labelKey: "notifications.changeInTask" },
  { id: "commentOnTask", labelKey: "notifications.commentOnTask" },
  { id: "reactionToTask", labelKey: "notifications.reactionToTask" },
  { id: "deadlines", labelKey: "notifications.deadlines" },
  { id: "newProject", labelKey: "notifications.newProject" },
  { id: "disableAll", labelKey: "notifications.disableAll" },
];

const DAYS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"] as const;

interface NotificationState {
  newTask: boolean;
  changeInTask: boolean;
  commentOnTask: boolean;
  reactionToTask: boolean;
  deadlines: boolean;
  newProject: boolean;
  disableAll: boolean;
}

const DEFAULT_NOTIFICATIONS: NotificationState = {
  newTask: true,
  changeInTask: true,
  commentOnTask: true,
  reactionToTask: true,
  deadlines: true,
  newProject: true,
  disableAll: false,
};

function Toggle({
  checked,
  onToggle,
  disabled,
}: {
  checked: boolean;
  onToggle: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => {
        haptics.light();
        onToggle();
      }}
      className={cn(
        "w-11 h-6 rounded-full flex-shrink-0 transition-colors duration-200 ease-[cubic-bezier(0.19,1,0.22,1)]",
        "flex items-center",
        checked ? "bg-[#BE87D8]" : "bg-[#28292D]"
      )}
    >
      <motion.span
        className="w-5 h-5 rounded-full bg-white shadow-sm"
        animate={{ x: checked ? 22 : 2 }}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
      />
    </button>
  );
}

export default function NotificationsPageClient() {
  const router = useRouter();
  const { t } = useLanguage();
  const [notifications, setNotifications] = useState<NotificationState>(DEFAULT_NOTIFICATIONS);
  const [workDays, setWorkDays] = useState<number[]>([0, 1, 2, 3, 4]); // Пн–Пт
  const [startHour, setStartHour] = useState("9");
  const [startMin, setStartMin] = useState("00");
  const [endHour, setEndHour] = useState("18");
  const [endMin, setEndMin] = useState("00");

  const toggleNotification = (id: keyof NotificationState) => {
    if (id === "disableAll") {
      setNotifications((prev) => ({
        ...prev,
        disableAll: !prev.disableAll,
        ...(prev.disableAll
          ? DEFAULT_NOTIFICATIONS
          : {
              newTask: false,
              changeInTask: false,
              commentOnTask: false,
              reactionToTask: false,
              deadlines: false,
              newProject: false,
            }),
      }));
      return;
    }
    setNotifications((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      if (next[id]) next.disableAll = false;
      return next;
    });
  };

  const toggleDay = (dayIndex: number) => {
    haptics.light();
    setWorkDays((prev) =>
      prev.includes(dayIndex) ? prev.filter((d) => d !== dayIndex) : [...prev, dayIndex].sort((a, b) => a - b)
    );
  };

  const clampNum = (v: string, max: number) => {
    const n = parseInt(v.replace(/\D/g, "").slice(0, 2), 10);
    if (Number.isNaN(n)) return "";
    return String(Math.min(Math.max(0, n), max));
  };

  const handleSave = () => {
    haptics.medium();
    // TODO: persist to Supabase / backend
    router.back();
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
          <h1 className="text-[22px] font-bold text-white mb-6">{t("notifications.title")}</h1>

          {/* Toggles */}
          <div className="rounded-[14px] bg-[#1E1F22] overflow-hidden mb-8">
            {NOTIFICATION_ITEMS.map((item, index) => (
              <div
                key={item.id}
                className={cn(
                  "w-full flex items-center justify-between px-4 py-4",
                  index !== NOTIFICATION_ITEMS.length - 1 && "border-b border-[#28292D]"
                )}
              >
                <span className="text-[15px] font-medium text-white">{t(item.labelKey)}</span>
                <Toggle
                  checked={notifications[item.id]}
                  onToggle={() => toggleNotification(item.id)}
                />
              </div>
            ))}
          </div>

          {/* Рабочее время */}
          <div className="mb-8">
            <h2 className="text-[11px] font-medium uppercase tracking-wider text-[#9097A7] mb-3">
              {t("notifications.workingHours")}
            </h2>
            <div className="flex gap-2 mb-4">
              {DAYS.map((day, i) => (
                <button
                  key={day}
                  type="button"
                  onClick={() => toggleDay(i)}
                  className={cn(
                    "flex-1 py-2.5 rounded-[10px] text-[13px] font-medium transition-colors duration-200",
                    workDays.includes(i)
                      ? "bg-[#BE87D8] text-white"
                      : "bg-[#1E1F22] text-[#9097A7]"
                  )}
                >
                  {day}
                </button>
              ))}
            </div>
            <div className="flex items-center justify-center gap-1">
              <input
                type="text"
                inputMode="numeric"
                maxLength={2}
                value={startHour}
                onChange={(e) => setStartHour(clampNum(e.target.value, 23))}
                className="w-12 h-12 rounded-[10px] bg-[#1E1F22] text-white text-center text-[18px] font-semibold border border-transparent focus:border-[#BE87D8] focus:outline-none"
              />
              <span className="text-[#9097A7] px-0.5">:</span>
              <input
                type="text"
                inputMode="numeric"
                maxLength={2}
                value={startMin}
                onChange={(e) => setStartMin(clampNum(e.target.value, 59))}
                className="w-12 h-12 rounded-[10px] bg-[#1E1F22] text-white text-center text-[18px] font-semibold border border-transparent focus:border-[#BE87D8] focus:outline-none"
              />
              <span className="text-[#9097A7] mx-2">–</span>
              <input
                type="text"
                inputMode="numeric"
                maxLength={2}
                value={endHour}
                onChange={(e) => setEndHour(clampNum(e.target.value, 23))}
                className="w-12 h-12 rounded-[10px] bg-[#1E1F22] text-white text-center text-[18px] font-semibold border border-transparent focus:border-[#BE87D8] focus:outline-none"
              />
              <span className="text-[#9097A7] px-0.5">:</span>
              <input
                type="text"
                inputMode="numeric"
                maxLength={2}
                value={endMin}
                onChange={(e) => setEndMin(clampNum(e.target.value, 59))}
                className="w-12 h-12 rounded-[10px] bg-[#1E1F22] text-white text-center text-[18px] font-semibold border border-transparent focus:border-[#BE87D8] focus:outline-none"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={handleSave}
            className="w-full py-4 rounded-[14px] bg-[var(--tg-theme-button-color)] text-[var(--tg-theme-button-text-color)] text-[16px] font-semibold flex items-center justify-center"
          >
            {t("notifications.saveChanges")}
          </button>
        </motion.div>
      </main>

      <BottomNavigation />
    </div>
  );
}
