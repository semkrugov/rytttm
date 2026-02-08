"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import AttentionCard from "./AttentionCard";
import { haptics } from "@/lib/telegram";
import { cn } from "@/lib/utils";

const exitTransition = {
  duration: 0.3,
  ease: [0.19, 1, 0.22, 1] as const,
};

interface AttentionCardsProps {
  notifications: any[];
  isExpanded: boolean;
  onToggleExpand: () => void;
  onAcceptAll?: () => void;
  hasAnimated?: boolean;
}

export default function AttentionCards({
  notifications,
  isExpanded,
  onToggleExpand,
  onAcceptAll,
}: AttentionCardsProps) {
  const [isDismissing, setIsDismissing] = useState(false);
  const [exitingList, setExitingList] = useState<typeof notifications>([]);
  const hasTriggeredExit = useRef(false);

  // Trigger exit by clearing exitingList one frame after starting dismiss
  useEffect(() => {
    if (!isDismissing || exitingList.length === 0) return;
    if (hasTriggeredExit.current) return;
    hasTriggeredExit.current = true;
    const id = requestAnimationFrame(() => {
      setExitingList([]);
    });
    return () => cancelAnimationFrame(id);
  }, [isDismissing, exitingList.length]);

  const listToRender = isDismissing ? exitingList : notifications;
  const total = listToRender.length;
  const showSection = (notifications.length > 0 || exitingList.length > 0);

  const handleAcceptAll = () => {
    if (!onAcceptAll || !notifications.length) return;
    haptics.medium();
    setIsDismissing(true);
    setExitingList([...notifications]);
    hasTriggeredExit.current = false;
  };

  const handleExitComplete = () => {
    if (exitingList.length > 0) return;
    if (isDismissing) {
      onAcceptAll?.();
      setIsDismissing(false);
    }
    setExitingList([]);
    hasTriggeredExit.current = false;
  };

  if (!showSection) return null;

  const handleToggle = () => {
    haptics.medium();
    onToggleExpand();
  };

  return (
    <div className="mx-auto w-full max-w-[360px] px-0">
      {onAcceptAll && (notifications.length > 0 || isDismissing) && (
        <div className="flex justify-end px-0 mb-3">
          <button
            type="button"
            onClick={handleAcceptAll}
            disabled={isDismissing}
            className="text-[16px] font-normal text-[#6CC2FF] active:opacity-80 disabled:opacity-50 transition-opacity"
          >
            Принять всё
          </button>
        </div>
      )}
      <motion.div
        layout
        className={cn(
          "relative flex flex-col",
          isExpanded ? "gap-[10px]" : "gap-0"
        )}
      >
        <AnimatePresence
          mode="popLayout"
          onExitComplete={handleExitComplete}
        >
          {listToRender.map((item, idx) => {
            const isVisible = isExpanded || idx < 4;
            if (!isVisible) return null;

            return (
              <motion.div
                key={item.id ?? `n-${idx}`}
                layout
                initial={false}
                animate={{
                  y: !isExpanded ? idx * 8 : 0,
                  scale: !isExpanded ? 1 - idx * 0.03 : 1,
                  opacity: !isExpanded ? (idx < 4 ? 1 - idx * 0.15 : 0) : 1,
                  zIndex: 50 - idx,
                }}
                exit={{
                  opacity: 0,
                  y: -12,
                  scale: 0.96,
                  transition: { ...exitTransition, delay: idx * 0.04 },
                }}
                transition={{
                  type: "spring",
                  stiffness: 150,
                  damping: 22,
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
        </AnimatePresence>

        {!isExpanded && listToRender.length > 0 && (
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
