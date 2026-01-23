"use client";

import { motion } from "framer-motion";
import { MessageCircle, Check, X } from "lucide-react";
import { AIInboxItem } from "@/types";
import { cn } from "@/lib/utils";
import { animationVariants } from "@/lib/animations";

interface AIInboxCardProps {
  item: AIInboxItem;
  onConfirm: (id: string) => void;
  onReject: (id: string) => void;
}

export default function AIInboxCard({
  item,
  onConfirm,
  onReject,
}: AIInboxCardProps) {
  const getConfidenceColor = (score: number) => {
    if (score >= 70) return "text-green-500";
    if (score >= 50) return "text-yellow-500";
    return "text-orange-500";
  };

  return (
    <motion.div
      layout
      variants={animationVariants.staggerItem}
      initial="initial"
      animate="animate"
      exit={{
        opacity: 0,
        scale: 0.95,
        y: -20,
        transition: {
          duration: 0.3,
          ease: [0.19, 1, 0.22, 1],
        },
      }}
      className="bg-[var(--tg-theme-secondary-bg-color)] rounded-xl p-4 mb-3"
    >
      <div className="flex items-start gap-3 mb-3">
        {/* Иконка чата */}
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-[var(--tg-theme-button-color)]/10 flex items-center justify-center">
          {item.chatIcon ? (
            <img
              src={item.chatIcon}
              alt={item.chatName}
              className="w-full h-full rounded-full object-cover"
            />
          ) : (
            <MessageCircle className="w-5 h-5 text-[var(--tg-theme-button-color)]" />
          )}
        </div>

        {/* Контент */}
        <div className="flex-1 min-w-0">
          <p className="text-xs text-[var(--tg-theme-hint-color)] mb-1">
            {item.chatName}
          </p>
          <h3 className="text-sm font-medium text-[var(--tg-theme-text-color)] mb-2">
            {item.title}
          </h3>
          <div className="flex items-center gap-2">
            <span className="text-xs text-[var(--tg-theme-hint-color)]">
              Уверенность:
            </span>
            <span
              className={cn(
                "text-xs font-semibold",
                getConfidenceColor(item.confidenceScore)
              )}
            >
              {item.confidenceScore}%
            </span>
          </div>
        </div>
      </div>

      {/* Кнопки действий */}
      <div className="flex gap-2">
        <motion.button
          onClick={() => onConfirm(item.id)}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-green-500 text-white font-medium text-sm"
          whileTap={{ scale: 0.95 }}
          transition={{
            type: "spring",
            stiffness: 400,
            damping: 25,
          }}
        >
          <Check className="w-4 h-4" strokeWidth={3} />
          Подтвердить
        </motion.button>
        <motion.button
          onClick={() => onReject(item.id)}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[var(--tg-theme-secondary-bg-color)] border border-[var(--tg-theme-hint-color)]/20 text-[var(--tg-theme-text-color)] font-medium text-sm"
          whileTap={{ scale: 0.95 }}
          transition={{
            type: "spring",
            stiffness: 400,
            damping: 25,
          }}
        >
          <X className="w-4 h-4" strokeWidth={3} />
          Отклонить
        </motion.button>
      </div>
    </motion.div>
  );
}
