"use client";

import { motion } from "framer-motion";
import { X } from "lucide-react";
import { TaskStatus } from "@/types";
import { cn } from "@/lib/utils";

interface StatusTabsProps {
  activeStatus: TaskStatus;
  onStatusChange: (status: TaskStatus) => void;
  onClear?: () => void;
}

const statusLabels: Record<TaskStatus, string> = {
  todo: "Не начал",
  doing: "В работе",
  done: "Готово",
};

export default function StatusTabs({
  activeStatus,
  onStatusChange,
  onClear,
}: StatusTabsProps) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <motion.div
        className="flex gap-2 flex-1 bg-[var(--tg-theme-secondary-bg-color)] rounded-full p-1 relative"
        initial={false}
      >
        {(Object.keys(statusLabels) as TaskStatus[]).map((status) => {
          const isActive = activeStatus === status;
          
          return (
            <motion.button
              key={status}
              onClick={() => onStatusChange(status)}
              className={cn(
                "relative flex-1 px-4 py-2 rounded-full text-sm font-semibold transition-colors z-10",
                isActive
                  ? "text-[var(--tg-theme-text-color)]"
                  : "text-[var(--tg-theme-hint-color)]"
              )}
              whileTap={{ scale: 0.95 }}
              transition={{
                type: "spring",
                stiffness: 300,
                damping: 30,
              }}
            >
              {statusLabels[status]}
              
              {/* Активный индикатор - белый pill */}
              {isActive && (
                <motion.div
                  layoutId="activeStatusTab"
                  className="absolute inset-0 bg-white rounded-full -z-10"
                  initial={false}
                  transition={{
                    type: "spring",
                    stiffness: 300,
                    damping: 30,
                  }}
                />
              )}
            </motion.button>
          );
        })}
      </motion.div>
      
      {onClear && (
        <motion.button
          onClick={onClear}
          className="w-9 h-9 rounded-full bg-[var(--tg-theme-secondary-bg-color)] flex items-center justify-center flex-shrink-0"
          whileTap={{ scale: 0.9 }}
        >
          <X className="w-4 h-4 text-[var(--tg-theme-text-color)]" />
        </motion.button>
      )}
    </div>
  );
}
