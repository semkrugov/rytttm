"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Play, Pause } from "lucide-react";
import AppHeader from "@/components/AppHeader";
import BottomNavigation from "@/components/BottomNavigation";
import { useLanguage } from "@/contexts/LanguageContext";
import { haptics } from "@/lib/telegram";
import { cn } from "@/lib/utils";

type AchievementStatus = "active" | "completed" | "in_progress";

interface Achievement {
  id: string;
  title: string;
  description: string;
  /** 0–1 */
  progress: number;
  /** CSS gradient for vinyl label, e.g. "from-purple-500 via-pink-400 to-white" */
  gradientClass: string;
  /** play | pause for overlay button */
  overlayIcon: "play" | "pause";
  status: AchievementStatus;
}

const ACHIEVEMENTS: Achievement[] = [
  {
    id: "together",
    title: "Вместе на ритме!",
    description: "Круто, теперь ты с нами, давай начнём на этом вайбе.",
    progress: 1,
    gradientClass: "from-[#BE87D8] via-[#E8A0C8] to-white",
    overlayIcon: "play",
    status: "completed",
  },
  {
    id: "four-beats",
    title: "4 доли",
    description: "Поставь 4 задачи. Это может быть кто-то из команды, либо твой личный toDo-лист.",
    progress: 0.65,
    gradientClass: "from-[#4ADE80] to-[#22D3EE]",
    overlayIcon: "play",
    status: "in_progress",
  },
  {
    id: "week-ttt",
    title: "Неделя ttt",
    description: "Впереди выходные, лови заряжающий на отдых ритм.",
    progress: 1,
    gradientClass: "from-[#FB923C] to-[#FACC15]",
    overlayIcon: "play",
    status: "completed",
  },
  {
    id: "jumpstyle",
    title: "Это джампстайл!",
    description: "Выполни все задачи, поставленные на неделю.",
    progress: 1,
    gradientClass: "from-[#60A5FA] via-[#A78BFA] to-white",
    overlayIcon: "pause",
    status: "active",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.05,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: [0.19, 1, 0.22, 1] },
  },
};

function VinylRecord({
  gradientClass,
  overlayIcon,
  isActive,
}: {
  gradientClass: string;
  overlayIcon: "play" | "pause";
  isActive?: boolean;
}) {
  return (
    <div className="relative flex-shrink-0 w-[72px] h-[72px]">
      {/* Vinyl disc */}
      <div className="absolute inset-0 rounded-full bg-[#0D0D0D] flex items-center justify-center shadow-inner">
        <div
          className={cn(
            "w-[32px] h-[32px] rounded-full bg-gradient-to-br shadow-lg",
            gradientClass
          )}
        />
      </div>
      {/* Play/Pause overlay */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          haptics.light();
        }}
        className={cn(
          "absolute bottom-0 right-0 w-8 h-8 rounded-full flex items-center justify-center",
          isActive
            ? "bg-transparent border-2 border-[#BE87D8] text-white"
            : "bg-[#28292D] text-white border border-[#3D3E42]"
        )}
      >
        {overlayIcon === "play" ? (
          <Play className="w-4 h-4 ml-0.5" fill="currentColor" stroke="none" />
        ) : (
          <Pause className="w-4 h-4" fill="currentColor" stroke="none" />
        )}
      </button>
    </div>
  );
}

function AchievementCard({
  achievement,
  index,
}: {
  achievement: Achievement;
  index: number;
}) {
  const progressGradient =
    achievement.gradientClass.includes("purple") || achievement.gradientClass.includes("BE87D8")
      ? "linear-gradient(90deg, #BE87D8, #E8A0C8)"
      : achievement.gradientClass.includes("green") || achievement.gradientClass.includes("4ADE80")
        ? "linear-gradient(90deg, #4ADE80, #22D3EE)"
        : achievement.gradientClass.includes("orange") || achievement.gradientClass.includes("FB923C")
          ? "linear-gradient(90deg, #FB923C, #FACC15)"
          : "linear-gradient(90deg, #60A5FA, #A78BFA)";

  return (
    <motion.article
      variants={cardVariants}
      className="rounded-[14px] bg-[#1E1F22] overflow-hidden flex flex-col"
    >
      <button
        type="button"
        onClick={() => haptics.light()}
        className="w-full flex items-start gap-3 p-4 text-left"
      >
        <VinylRecord
          gradientClass={achievement.gradientClass}
          overlayIcon={achievement.overlayIcon}
          isActive={achievement.status === "active" || achievement.status === "completed"}
        />
        <div className="flex-1 min-w-0 pt-0.5">
          <h3 className="text-[15px] font-semibold text-white leading-tight mb-1">
            {achievement.title}
          </h3>
          <p className="text-[13px] text-[#9097A7] leading-snug">
            {achievement.description}
          </p>
        </div>
      </button>
      {/* Progress bar */}
      <div className="h-1 w-full bg-[#28292D]">
        <motion.div
          className="h-full rounded-r-full"
          style={{ background: progressGradient }}
          initial={{ width: 0 }}
          animate={{ width: `${achievement.progress * 100}%` }}
          transition={{ duration: 0.5, ease: [0.19, 1, 0.22, 1], delay: 0.1 + index * 0.05 }}
        />
      </div>
    </motion.article>
  );
}

export default function AchievementsPageClient() {
  const router = useRouter();
  const { t } = useLanguage();

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
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="pt-2"
        >
          <h1 className="text-[22px] font-bold text-white mb-6">{t("achievements.title")}</h1>

          <div className="grid grid-cols-2 gap-3">
            {ACHIEVEMENTS.map((a, i) => (
              <AchievementCard key={a.id} achievement={a} index={i} />
            ))}
          </div>
        </motion.div>
      </main>

      <BottomNavigation />
    </div>
  );
}
