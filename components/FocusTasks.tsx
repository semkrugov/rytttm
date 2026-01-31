"use client";

import { motion, AnimatePresence } from "framer-motion";
import { animationVariants } from "@/lib/animations";
import TaskCheckbox from "./TaskCheckbox";
import { cn, generateColorFromString } from "@/lib/utils";
import { useHasAnimated } from "@/hooks/useHasAnimated";

export interface Task {
  id: string;
  title: string;
  project?: string;
  projectTitle?: string;
  deadline?: string;
  completed: boolean;
}

interface FocusTasksProps {
  tasks: Task[];
  onTaskToggle: (taskId: string, completed: boolean) => void;
  onTaskClick?: (taskId: string) => void;
  /**
   * Позволяет использовать компонент внутри собственного контейнера и заголовка.
   * По умолчанию заголовок "Мой фокус" отображается.
   */
  hideHeader?: boolean;
  className?: string;
}

export default function FocusTasks({
  tasks,
  onTaskToggle,
  onTaskClick,
  hideHeader,
  className,
}: FocusTasksProps) {
  const hasAnimated = useHasAnimated();
  
  return (
    <motion.div
      variants={hasAnimated ? undefined : animationVariants.staggerItem}
      initial={hasAnimated ? false : "initial"}
      animate="animate"
      className={cn("mb-6", className)}
    >
      {!hideHeader && (
        <h2 className="text-lg font-semibold text-[var(--tg-theme-text-color)] mb-4">
          Мой Фокус
        </h2>
      )}
      <motion.div
        variants={hasAnimated ? undefined : animationVariants.staggerContainer}
        initial={hasAnimated ? false : "initial"}
        animate={hasAnimated ? false : "animate"}
        className="flex flex-col"
      >
        <AnimatePresence mode="sync" initial={false}>
          {tasks.map((task, index) => (
            <motion.div
              key={task.id}
              variants={hasAnimated ? undefined : animationVariants.staggerItem}
              initial={hasAnimated ? false : { opacity: 0 }}
              animate={hasAnimated ? { opacity: 1 } : { opacity: 1 }}
              exit={{ opacity: 0, transition: { duration: 0.15 } }}
              whileTap={{ scale: 0.98 }}
              transition={hasAnimated ? { duration: 0 } : {
                type: "spring",
                stiffness: 300,
                damping: 30,
              }}
              onClick={() => onTaskClick?.(task.id)}
              className={cn(
                "flex items-center gap-3 px-[18px] py-[18px]",
                index !== tasks.length - 1 && "border-b border-[#28292D]",
                task.completed && "opacity-60",
                "cursor-pointer"
              )}
            >
              <TaskCheckbox
                checked={task.completed}
                onChange={(checked) => onTaskToggle(task.id, checked)}
              />
              <div className="flex-1 min-w-0">
                <p
                  className={cn(
                    "text-[16px] font-normal text-white truncate",
                    task.completed && "line-through opacity-50"
                  )}
                >
                  {task.title}
                </p>
                {task.projectTitle && (
                  <p className="text-[12px] text-[#9097A7] mt-0.5">
                    {task.projectTitle}
                  </p>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}
