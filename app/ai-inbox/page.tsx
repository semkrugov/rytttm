"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles } from "lucide-react";
import AppHeader from "@/components/AppHeader";
import BottomNavigation from "@/components/BottomNavigation";
import AIInboxCard from "@/components/AIInboxCard";
import Toast from "@/components/Toast";
import { AIInboxItem } from "@/types";
import { mockAIInboxItems } from "@/lib/mockData";
import { haptics } from "@/lib/telegram";
import { useHasAnimated } from "@/hooks/useHasAnimated";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
      ease: [0.19, 1, 0.22, 1],
    },
  },
};

export default function AIInboxPage() {
  const hasAnimated = useHasAnimated();
  const [items, setItems] = useState<AIInboxItem[]>(mockAIInboxItems);
  const [toastMessage, setToastMessage] = useState<string>("");
  const [showToast, setShowToast] = useState(false);

  const handleConfirm = (id: string) => {
    if (typeof window !== "undefined") {
      haptics.medium();
    }
    
    // Удаляем карточку из списка
    setItems((prevItems) => prevItems.filter((item) => item.id !== id));
    
    // Показываем уведомление
    setToastMessage("Задача добавлена в фокус");
    setShowToast(true);
  };

  const handleReject = (id: string) => {
    if (typeof window !== "undefined") {
      haptics.light();
    }
    
    // Удаляем карточку из списка
    setItems((prevItems) => prevItems.filter((item) => item.id !== id));
  };

  const handleSummary = () => {
    if (typeof window !== "undefined") {
      haptics.medium();
    }
    // TODO: Open AI Summary modal
    console.log("AI Summary");
  };

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
          animate={hasAnimated ? { opacity: 1, y: 0 } : { opacity: 1, y: 0 }}
          transition={hasAnimated ? { duration: 0 } : {
            duration: 0.4,
            ease: [0.19, 1, 0.22, 1],
          }}
        >
          <AppHeader />
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-[var(--tg-theme-text-color)] mb-4">
              Интеллект-центр
            </h1>
            
            {/* Кнопка Сводка дня */}
            <motion.button
              onClick={handleSummary}
              className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-[var(--tg-theme-button-color)] text-white font-semibold text-base shadow-lg"
              whileTap={{ scale: 0.98 }}
              transition={{
                type: "spring",
                stiffness: 300,
                damping: 30,
              }}
            >
              <Sparkles className="w-5 h-5" />
              Сводка дня (AI Summary)
            </motion.button>
          </div>

          {/* Список предложений */}
          <motion.div
            variants={hasAnimated ? undefined : containerVariants}
            initial={hasAnimated ? false : "hidden"}
            animate={hasAnimated ? false : "visible"}
            className="mb-4"
          >
            <AnimatePresence mode="popLayout">
              {items.length > 0 ? (
                items.map((item) => (
                  <motion.div
                    key={item.id}
                    variants={hasAnimated ? undefined : itemVariants}
                    initial={hasAnimated ? false : undefined}
                    animate={hasAnimated ? false : "visible"}
                    layout
                  >
                    <AIInboxCard
                      item={item}
                      onConfirm={handleConfirm}
                      onReject={handleReject}
                    />
                  </motion.div>
                ))
              ) : (
                <motion.div
                  key="empty"
                  initial={hasAnimated ? false : { opacity: 0, y: 20 }}
                  animate={hasAnimated ? { opacity: 1, y: 0 } : { opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={hasAnimated ? { duration: 0 } : {
                    duration: 0.3,
                    ease: [0.19, 1, 0.22, 1],
                  }}
                  className="text-center py-12"
                >
                  <p className="text-[var(--tg-theme-hint-color)]">
                    Нет новых предложений от ИИ
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      </main>

      {/* Toast уведомление */}
      <Toast
        message={toastMessage}
        isVisible={showToast}
        onClose={() => setShowToast(false)}
      />

      {/* Нижняя навигация */}
      <BottomNavigation />
    </div>
  );
}
