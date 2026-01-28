"use client";

import { motion, AnimatePresence } from "framer-motion";
import AttentionCard from "./AttentionCard";
import { haptics } from "@/lib/telegram";
import { cn } from "@/lib/utils";

interface AttentionCardsProps {
  notifications: any[];
  isExpanded: boolean;
  onToggleExpand: () => void;
  hasAnimated?: boolean;
}

export default function AttentionCards({
  notifications,
  isExpanded,
  onToggleExpand,
}: AttentionCardsProps) {
  if (!notifications?.length) return null;

  const total = notifications.length;

  const handleToggle = () => {
    haptics.medium();
    onToggleExpand();
  };

  return (
    <div className="mx-auto w-full max-w-[360px] px-0">
      <motion.div
        layout
        className={cn(
          "relative flex flex-col",
          isExpanded ? "gap-[10px]" : "gap-0"
        )}
      >
        {notifications.map((item, idx) => {
          const isVisible = isExpanded || idx < 4;
          if (!isVisible) return null;

          return (
            <motion.div
              key={item.id || idx}
              layout
              initial={false}
              animate={{
                y: !isExpanded ? idx * 8 : 0,
                scale: !isExpanded ? 1 - idx * 0.03 : 1,
                opacity: !isExpanded ? (idx < 4 ? 1 - idx * 0.15 : 0) : 1,
                zIndex: 50 - idx,
              }}
              transition={{
                type: "spring",
                stiffness: 150,
                damping: 22
              }}
              className={cn(
                "left-0 right-0",
                !isExpanded && idx > 0 ? "absolute top-0" : "relative"
              )}
            >
              <AttentionCard
                title={item.title}
                message={item.message}
                time={item.time}
                addLabel={!isExpanded && idx === 0 && total > 1 ? `Ещё ${total - 1} уведомлений` : undefined}
              />
            </motion.div>
          );
        })}
        
        {!isExpanded && (
          <div className="h-6 w-full pointer-events-none" />
        )}
      </motion.div>

      <div className={cn(
        "flex flex-col items-center justify-start transition-all duration-500",
        !isExpanded ? "-mt-4" : "mt-2"
      )}>
        <button 
          onClick={handleToggle}
          className="relative z-[60] px-2 py-0 opacity-100 active:scale-95 transition-all"
        >
          <img
            src="/assets/attention-swiper.svg"
            alt=""
            className={cn(
              "h-5 w-16 transition-transform duration-500",
              isExpanded && "rotate-180"
            )}
          />
        </button>
      </div>
    </div>
  );
}
