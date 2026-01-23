"use client";

import { Bell } from "lucide-react";
import { motion } from "framer-motion";
import { animationVariants } from "@/lib/animations";

interface NotificationCardProps {
  title: string;
  message: string;
  time?: string;
}

export default function NotificationCard({
  title,
  message,
  time,
}: NotificationCardProps) {
  return (
    <motion.div
      variants={animationVariants.staggerItem}
      initial="initial"
      animate="animate"
      whileTap={{ scale: 0.98 }}
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 30,
      }}
      className="bg-[var(--tg-theme-secondary-bg-color)] rounded-2xl p-4 mb-4"
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-[var(--tg-theme-button-color)]/10 flex items-center justify-center">
          <Bell className="w-5 h-5 text-[var(--tg-theme-button-color)]" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-[var(--tg-theme-text-color)] mb-1">
            {title}
          </h3>
          <p className="text-sm text-[var(--tg-theme-hint-color)] line-clamp-2">
            {message}
          </p>
          {time && (
            <p className="text-xs text-[var(--tg-theme-hint-color)] mt-2">
              {time}
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
}
