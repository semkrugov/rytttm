"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Calendar, Play } from "lucide-react";
import { Task, TaskStatus } from "@/types";
import { cn } from "@/lib/utils";
import { animationVariants } from "@/lib/animations";
import { useHasAnimated } from "@/hooks/useHasAnimated";

interface TasksListCardProps {
  task: Task;
  isLast: boolean;
  onStatusChange: (taskId: string, newStatus: TaskStatus) => void;
}

/** Аватарки автора задачи и участников (assignee), без дублей */
function TaskAvatars({ task }: { task: Task }) {
  const author = task.author;
  const assignee = task.assignee;
  const samePerson = task.creatorId && task.assigneeId && task.creatorId === task.assigneeId;

  const people: Array<{ username: string | null; avatar_url: string | null }> = [];
  if (author) people.push(author);
  if (assignee && !samePerson) people.push(assignee);

  if (people.length === 0) {
    return (
      <div className="w-8 h-8 rounded-full border-2 border-[#1E1E1E] flex items-center justify-center bg-[#A0A0A0]/30 text-[#A0A0A0] text-xs font-medium flex-shrink-0">
        ?
      </div>
    );
  }

  return (
    <div className="flex -space-x-3 flex-shrink-0">
      {people.map((p, i) =>
        p.avatar_url ? (
          <img
            key={i}
            src={p.avatar_url}
            alt={p.username ?? ""}
            className="w-8 h-8 rounded-full border-2 border-[#1E1E1E] object-cover"
          />
        ) : (
          <div
            key={i}
            className="w-8 h-8 rounded-full border-2 border-[#1E1E1E] flex items-center justify-center bg-[#FFC107] text-white text-sm font-bold"
            title={p.username ?? ""}
          >
            {(p.username ?? "U")[0].toUpperCase()}
          </div>
        )
      )}
    </div>
  );
}

/** Карточка задачи по макету Figma node 641-1930: фон #1E1E1E, скругление 10px, дата/таймер/заголовок/проект/аватарки */
export default function TasksListCard({
  task,
  isLast,
  onStatusChange,
}: TasksListCardProps) {
  const router = useRouter();
  const hasAnimated = useHasAnimated();

  const handleRowClick = () => {
    router.push(`/tasks/${task.id}`);
  };

  return (
    <motion.div
      layout
      variants={hasAnimated ? undefined : animationVariants.staggerItem}
      initial={hasAnimated ? false : { opacity: 0, y: 10 }}
      animate={hasAnimated ? { opacity: 1, y: 0 } : { opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20, transition: { duration: 0.2 } }}
      whileTap={{ scale: 0.98 }}
      transition={
        hasAnimated
          ? { duration: 0 }
          : { type: "spring", stiffness: 300, damping: 30 }
      }
      onClick={handleRowClick}
      className={cn(
        "rounded-[10px] bg-[#1E1E1E] p-[18px] cursor-pointer w-full",
        !isLast && "mb-3",
        task.completed && "opacity-60"
      )}
    >
      {/* Верхняя строка: дата слева (иконка #BE87D8), таймер справа (зелёный) */}
      <div className="flex items-center justify-between mb-3">
        {task.deadlineTime ? (
          <span className="flex items-center gap-2 text-[14px] text-[#BE87D8]">
            <Calendar className="w-4 h-4 flex-shrink-0 text-[#BE87D8]" />
            {task.deadlineTime}
          </span>
        ) : (
          <span className="flex items-center gap-2 text-[14px] text-[#A0A0A0]">
            <Calendar className="w-4 h-4 flex-shrink-0 text-[#BE87D8]" />
            —
          </span>
        )}
        <span className="flex items-center gap-2 text-[14px] text-[#4CAF50]">
          <Play className="w-[18px] h-[18px] flex-shrink-0 text-[#4CAF50]" />
          {task.timeTracking ?? "00:00"}
        </span>
      </div>

      {/* Заголовок: 16–18px, white, medium/semi-bold, line-clamp */}
      <p
        className={cn(
          "text-[17px] font-medium text-white line-clamp-2 leading-[24px] mb-3",
          task.completed && "line-through opacity-70"
        )}
      >
        {task.title}
      </p>

      {/* Нижняя строка: название проекта слева, аватарки автора и участников справа (overlap) */}
      <div className="flex items-center justify-between min-h-[32px]">
        {task.projectTitle ? (
          <span className="text-[12px] text-[#A0A0A0] truncate flex-1 mr-2">
            {task.projectTitle}
          </span>
        ) : (
          <span />
        )}
        <TaskAvatars task={task} />
      </div>
    </motion.div>
  );
}
