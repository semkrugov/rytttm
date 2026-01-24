"use client";

import { motion } from "framer-motion";
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
}

export default function FocusTasks({ tasks, onTaskToggle }: FocusTasksProps) {
  const hasAnimated = useHasAnimated();
  
  return (
    <motion.div
      variants={hasAnimated ? undefined : animationVariants.staggerItem}
      initial={hasAnimated ? false : "initial"}
      animate="animate"
      className="mb-6"
    >
      <h2 className="text-lg font-semibold text-[var(--tg-theme-text-color)] mb-4">
        Мой Фокус
      </h2>
      <motion.div
        variants={hasAnimated ? undefined : animationVariants.staggerContainer}
        initial={hasAnimated ? false : "initial"}
        animate={hasAnimated ? false : "animate"}
        className="space-y-3"
      >
        {tasks.map((task, index) => (
          <motion.div
            key={task.id}
            variants={hasAnimated ? undefined : animationVariants.staggerItem}
            initial={hasAnimated ? false : { opacity: 0, y: 10 }}
            animate={hasAnimated ? { opacity: 1, y: 0 } : { opacity: 1, y: 0 }}
            whileTap={{ scale: 0.98 }}
            transition={hasAnimated ? { duration: 0 } : {
              type: "spring",
              stiffness: 300,
              damping: 30,
            }}
            className={cn(
              "bg-[var(--tg-theme-secondary-bg-color)] rounded-xl p-4",
              "flex items-center gap-3",
              task.completed && "opacity-60"
            )}
          >
            <TaskCheckbox
              checked={task.completed}
              onChange={(checked) => onTaskToggle(task.id, checked)}
            />
            <div className="flex-1 min-w-0">
              <p
                className={cn(
                  "text-sm font-medium text-[var(--tg-theme-text-color)]",
                  task.completed && "line-through"
                )}
              >
                {task.title}
              </p>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                {task.projectTitle && (
                  <motion.span
                    className="text-xs px-2 py-0.5 rounded-full text-white font-medium"
                    style={{
                      backgroundColor: generateColorFromString(task.projectTitle),
                    }}
                    initial={hasAnimated ? false : { opacity: 0, scale: 0.8 }}
                    animate={hasAnimated ? { opacity: 1, scale: 1 } : { opacity: 1, scale: 1 }}
                    transition={hasAnimated ? { duration: 0 } : {
                      duration: 0.2,
                      ease: [0.19, 1, 0.22, 1],
                    }}
                  >
                    {task.projectTitle}
                  </motion.span>
                )}
                {task.deadline && (
                  <p className="text-xs text-[var(--tg-theme-hint-color)]">
                    {task.deadline}
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </motion.div>
  );
}
