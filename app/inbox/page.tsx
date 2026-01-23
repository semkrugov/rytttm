"use client";

import { motion } from "framer-motion";
import BottomNavigation from "@/components/BottomNavigation";

export default function InboxPage() {
  return (
    <div className="min-h-screen bg-[var(--tg-theme-bg-color)]">
      <main
        className="container mx-auto px-4 py-6 pb-24"
        style={{
          paddingBottom: "calc(6rem + env(safe-area-inset-bottom))",
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.4,
            ease: [0.19, 1, 0.22, 1],
          }}
        >
          <h1 className="text-2xl font-bold text-[var(--tg-theme-text-color)] mb-6">
            AI-Инбокс
          </h1>
          <p className="text-[var(--tg-theme-hint-color)]">
            Страница в разработке
          </p>
        </motion.div>
      </main>
      <BottomNavigation />
    </div>
  );
}
