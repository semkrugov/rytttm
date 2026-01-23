"use client";

import { motion } from "framer-motion";
import { animationVariants } from "@/lib/animations";
import TaskCheckbox from "./TaskCheckbox";
import { cn } from "@/lib/utils";

export interface Task {
  id: string;
  title: string;
  project?: string;
  deadline?: string;
  completed: boolean;
}

interface FocusTasksProps {
  tasks: Task[];
  onTaskToggle: (taskId: string, completed: boolean) => void;
}

export default function FocusTasks({ tasks, onTaskToggle }: FocusTasksProps) {
  return (
    <motion.div
      variants={animationVariants.staggerItem}
      initial="initial"
      animate="animate"
      className="mb-6"
    >
      <h2 className="text-lg font-semibold text-[var(--tg-theme-text-color)] mb-4">
        Мой Фокус
      </h2>
      <motion.div
        variants={animationVariants.staggerContainer}
        initial="initial"
        animate="animate"
        className="space-y-3"
      >
        {tasks.map((task, index) => (
          <motion.div
            key={task.id}
            variants={animationVariants.staggerItem}
            whileTap={{ scale: 0.98 }}
            transition={{
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
              {task.project && (
                <p className="text-xs text-[var(--tg-theme-hint-color)] mt-1">
                  {task.project}
                </p>
              )}
              {task.deadline && (
                <p className="text-xs text-[var(--tg-theme-hint-color)] mt-1">
                  {task.deadline}
                </p>
              )}
            </div>
          </motion.div>
        ))}
      </motion.div>
    </motion.div>
  );
}
