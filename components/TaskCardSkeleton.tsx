"use client";

import { motion } from "framer-motion";
import { animationVariants } from "@/lib/animations";

export default function TaskCardSkeleton() {
  return (
    <motion.div
      variants={animationVariants.staggerItem}
      initial="initial"
      animate="animate"
      className="bg-[var(--tg-theme-secondary-bg-color)] rounded-xl p-4 mb-3"
    >
      <div className="animate-pulse">
        <div className="h-4 bg-[var(--tg-theme-hint-color)]/20 rounded mb-3 w-3/4"></div>
        <div className="flex items-center justify-between">
          <div className="h-3 bg-[var(--tg-theme-hint-color)]/20 rounded w-16"></div>
          <div className="h-3 bg-[var(--tg-theme-hint-color)]/20 rounded w-24"></div>
        </div>
      </div>
    </motion.div>
  );
}
