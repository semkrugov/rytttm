"use client";

import { motion } from "framer-motion";
import { X } from "lucide-react";
import { TaskStatus } from "@/types";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";
import { haptics } from "@/lib/telegram";

export type TasksPageFilter = "all" | TaskStatus;

interface StatusTabsProps {
  activeStatus: TaskStatus;
  onStatusChange: (status: TaskStatus) => void;
  onClear?: () => void;
  /** Убирает нижний отступ при использовании внутри блока (например, на странице задач) */
  embedded?: boolean;
  /** Вариант для страницы задач: табы «Все» / «В работе» / «Готово» с градиентом на активном */
  variant?: "default" | "tasks";
}

interface StatusTabsTasksProps extends Omit<StatusTabsProps, "activeStatus" | "onStatusChange"> {
  activeStatus: TasksPageFilter;
  onStatusChange: (status: TasksPageFilter) => void;
  variant: "tasks";
}

const statusLabelKeys: Record<TaskStatus, string> = {
  todo: "status.todo",
  doing: "status.doing",
  done: "status.done",
};

const tasksFilterLabelKeys: Record<TasksPageFilter, string> = {
  all: "status.all",
  todo: "status.todo",
  doing: "status.doing",
  done: "status.done",
};

const tasksFilterValues: TasksPageFilter[] = ["all", "doing", "done"];

export default function StatusTabs(
  props: StatusTabsProps | StatusTabsTasksProps
) {
  const {
    activeStatus,
    onStatusChange,
    onClear,
    embedded = false,
    variant = "default",
  } = props;
  const { t } = useLanguage();
  const isTasksVariant = variant === "tasks";

  if (isTasksVariant) {
    const filter = activeStatus as TasksPageFilter;
    const setFilter = onStatusChange as (s: TasksPageFilter) => void;

    const handleTabClick = (value: TasksPageFilter) => {
      haptics.light();
      setFilter(value);
    };

    return (
      <div className={cn("flex items-center gap-2 w-full", !embedded && "mb-4")}>
        <motion.div
          className="flex w-full h-11 rounded-[10px] p-[3px] relative bg-[#1E1F22]"
          initial={false}
        >
          {tasksFilterValues.map((value) => {
            const isActive = filter === value;
            return (
              <motion.button
                key={value}
                onClick={() => handleTabClick(value)}
                className={cn(
                  "relative flex-1 h-full rounded-[8px] text-[14px] font-medium transition-colors z-10",
                  isActive ? "text-white" : "text-[#9097A7]"
                )}
                whileTap={{ scale: 0.98 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              >
                {t(tasksFilterLabelKeys[value])}
                {isActive && (
                  <motion.div
                    layoutId="activeTasksTab"
                    className="absolute inset-0 rounded-[8px] -z-10"
                    style={{
                      background: "linear-gradient(90deg, #C3CBFF 0%, #F6B3FF 100%)",
                    }}
                    initial={false}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
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

  return (
    <div className={cn("flex items-center gap-2", !embedded && "mb-4")}>
      <motion.div
        className="flex gap-2 flex-1 bg-[var(--tg-theme-secondary-bg-color)] rounded-full p-1 relative"
        initial={false}
      >
        {(Object.keys(statusLabelKeys) as TaskStatus[]).map((status) => {
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
              {t(statusLabelKeys[status])}
              
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
