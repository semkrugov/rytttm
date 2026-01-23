"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Check } from "lucide-react";

interface ToastProps {
  message: string;
  isVisible: boolean;
  onClose: () => void;
}

export default function Toast({ message, isVisible, onClose }: ToastProps) {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.9 }}
          transition={{
            duration: 0.3,
            ease: [0.19, 1, 0.22, 1],
          }}
          className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-[var(--tg-theme-secondary-bg-color)] border border-[var(--tg-theme-hint-color)]/20 rounded-xl px-4 py-3 shadow-lg backdrop-blur-safe"
          onAnimationComplete={() => {
            setTimeout(() => {
              onClose();
            }, 2000);
          }}
        >
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
              <Check className="w-3 h-3 text-white" strokeWidth={3} />
            </div>
            <span className="text-sm font-medium text-[var(--tg-theme-text-color)]">
              {message}
            </span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
