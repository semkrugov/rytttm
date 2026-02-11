"use client";

import { useState, useEffect, useRef, useCallback } from "react";
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
  
  const [firstCardHeight, setFirstCardHeight] = useState(200);
  const observerRef = useRef<ResizeObserver | null>(null);

  const setFirstCardRef = useCallback((node: HTMLDivElement | null) => {
    if (observerRef.current) {
      observerRef.current.disconnect();
      observerRef.current = null;
    }

    if (node) {
      // Сразу берем высоту, чтобы не ждать ResizeObserver
      setFirstCardHeight(node.offsetHeight || 200);

      const observer = new ResizeObserver((entries) => {
        const entry = entries[0];
        if (entry) {
          const height = entry.borderBoxSize?.[0]?.blockSize ?? (entry.target as HTMLElement).offsetHeight;
          setFirstCardHeight(height);
        }
      });
      
      observer.observe(node);
      observerRef.current = observer;
    }
  }, []);

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

  // Динамический расчет смещения с учетом реальной высоты карточки.
  // Используем transformOrigin: "top center", поэтому scale уменьшает высоту снизу вверх полностью.
  const idxForCalculation = Math.min(Math.max(total - 1, 0), 3);
  const yOffset = idxForCalculation * 8;
  
  // При origin-top уменьшение высоты = H * (1 - scale) = H * (idx * 0.03)
  const scaleShrink = firstCardHeight * (idxForCalculation * 0.03);
  
  // Считаем реальный выступ стопки относительно низа первой карточки
  // Не ограничиваем снизу, так как при больших карточках выступ может быть отрицательным (выше низа первой карты)
  const stackProtrusion = yOffset - scaleShrink;
  
  const stackOffset = isExpanded ? 0 : stackProtrusion;
  
  // В свернутом виде нужен большой нахлест (-12px), чтобы скрыть дырку при масштабировании.
  // В развернутом виде нахлест минимальный (-2px), чтобы язычок торчал полностью и его было видно.
  const overlap = isExpanded ? -2 : -12;
  const buttonMarginTop = stackOffset + overlap;

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
            className="text-[14px] font-normal text-[#6CC2FF] active:opacity-80 disabled:opacity-50 transition-opacity"
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
                ref={idx === 0 ? setFirstCardRef : null}
                layout
                initial={false}
                animate={{
                  y: !isExpanded ? idx * 8 : 0,
                  scale: !isExpanded ? 1 - idx * 0.03 : 1,
                  // Убираем сильное затемнение нижних карточек, чтобы их было видно на темном фоне
                  opacity: !isExpanded ? (idx < 4 ? 1 : 0) : 1,
                  zIndex: 50 - idx,
                }}
                style={{ transformOrigin: "top center" }}
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

      <div 
        className="flex flex-col items-center justify-start relative z-[10] transition-[margin] duration-300 ease-[cubic-bezier(0.19,1,0.22,1)]"
        style={{ marginTop: buttonMarginTop }}
      >
        <button 
          onClick={handleToggle}
          className="active:scale-95 transition-transform"
        >
          <svg width="72" height="19" viewBox="0 0 72 19" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M11.2692 4.61399L22.3189 15.5355C24.5633 17.754 27.6076 19 30.781 19H41.2181C44.3924 19 47.4367 17.754 49.6803 15.5355L60.73 4.61399C63.7202 1.65925 67.7733 0 72 0H0C4.22665 0 8.28059 1.65925 11.2692 4.61399Z" fill="#151617"/>
            <motion.path 
              d="M31 5.33887L35.6318 9.97063C36.0223 10.3612 36.6554 10.3612 37.046 9.97063L41.6777 5.33887" 
              stroke="#9097A7" 
              strokeWidth="2" 
              strokeLinecap="round"
              animate={{ rotate: isExpanded ? 180 : 0 }}
              initial={false}
              transition={{ duration: 0.3, ease: [0.19, 1, 0.22, 1] }}
              style={{ originX: "50%", originY: "50%", cx: 36, cy: 7.65 }}
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
