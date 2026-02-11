"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, PanInfo, useMotionValue, useTransform, animate } from "framer-motion";
import { Calendar, Play, Check, X, Flame, MessageSquare, Hourglass, Bug, Lightbulb, ArrowLeft } from "lucide-react";
import { Task, TaskStatus } from "@/types";
import { cn } from "@/lib/utils";
import { animationVariants } from "@/lib/animations";
import { useHasAnimated } from "@/hooks/useHasAnimated";
import { useTimeTracking } from "@/contexts/TimeTrackingContext";

function formatTimeTracking(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

interface TasksListCardProps {
  task: Task;
  isLast: boolean;
  onStatusChange: (taskId: string, newStatus: TaskStatus) => void;
  onDelete?: (taskId: string) => void;
  variant?: "card" | "list";
}

const STATUS_CONFIG: Record<TaskStatus, { label: string; bgColor: string; textColor: string }> = {
  todo: { label: "Не начал", bgColor: "bg-[#6C7A89]/20", textColor: "text-[#6C7A89]" },
  doing: { label: "В работе", bgColor: "bg-[#F39C12]/20", textColor: "text-[#F39C12]" },
  done: { label: "Готово", bgColor: "bg-[#4CAF50]/20", textColor: "text-[#4CAF50]" },
};

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
  onDelete,
  variant = "card",
}: TasksListCardProps) {
  const router = useRouter();
  const hasAnimated = useHasAnimated();
  const { activeTaskId, elapsedSeconds } = useTimeTracking();
  const [isSwiped, setIsSwiped] = useState(false);
  const x = useMotionValue(0);
  const bubbleScale = useTransform(x, [0, -80], [0, 1], { clamp: true });

  const isDone = task.status === "done";

  const isTimerActive = activeTaskId === task.id;
  const displayTime = isTimerActive
    ? formatTimeTracking(elapsedSeconds)
    : (task.timeTracking ?? "00:00");

  const snapTo = (target: number) => {
    animate(x, target, {
      ...animationVariants.spring,
      duration: animationVariants.duration.medium,
      ease: animationVariants.easing["ease-out-expo"],
    });
  };

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.x < -50 || info.velocity.x < -300) {
      setIsSwiped(true);
      snapTo(-90);
      if (typeof window !== "undefined" && "vibrate" in window.navigator) {
        window.navigator.vibrate(10);
      }
      return;
    }

    setIsSwiped(false);
    snapTo(0);
  };

  const handleRowClick = () => {
    router.push(`/tasks/${task.id}`);
  };

  return (
    <motion.div
      layout="position"
      className={cn(
        "relative w-full",
        variant === "card" && !isLast && "mb-3",
        variant === "list" && "mb-0"
      )}
      transition={{
        layout: {
          ...animationVariants.spring,
          duration: animationVariants.duration.medium,
          ease: animationVariants.easing["ease-out-expo"],
        },
      }}
    >
      {/* Бабл действия справа под карточкой */}
      <motion.button
        type="button"
        className={cn(
          "absolute inset-y-0 right-0 w-[80px] flex items-center justify-center shadow-lg z-0",
          variant === "card" && "rounded-[14px]",
          isDone ? "bg-[#3B82F6]" : "bg-[#22C55E]"
        )}
        style={{ scale: bubbleScale }}
        transition={{
          ...animationVariants.spring,
          duration: animationVariants.duration.fast,
          ease: animationVariants.easing["ease-out-expo"],
        }}
        onTap={(event) => {
          event.stopPropagation();
          if (isDone) {
            onStatusChange(task.id, "todo");
          } else {
            onStatusChange(task.id, "done");
          }
        }}
      >
        {isDone ? (
          <ArrowLeft className="w-7 h-7 text-white" strokeWidth={3} />
        ) : (
          <Check className="w-7 h-7 text-white" strokeWidth={3} />
        )}
      </motion.button>

      {/* Свайп-карточка */}
      <motion.div
        style={{ x }}
        drag="x"
        dragConstraints={{ left: -90, right: 0 }}
        dragElastic={0.15}
        onDragEnd={handleDragEnd}
        initial={
          hasAnimated
            ? false
            : { opacity: 0, y: 8, scale: 0.98 }
        }
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{
          opacity: 0,
          y: -6,
          transition: {
            duration: animationVariants.duration.fast,
            ease: animationVariants.easing["ease-out-quart"],
          },
        }}
        whileTap={{ scale: 0.97 }}
        transition={{
          duration: animationVariants.duration.medium,
          ease: animationVariants.easing["ease-out-expo"],
          ...animationVariants.spring,
        }}
        onTap={() => {
          if (isSwiped) {
            setIsSwiped(false);
            snapTo(0);
          } else {
            handleRowClick();
          }
        }}
        className={cn(
          "relative bg-[#1E1E1E] p-[18px] cursor-pointer w-full z-10",
          variant === "card" && "rounded-[10px]",
          variant === "list" && !isLast && "border-b border-[#28292D]",
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
            <Play className={cn("w-[18px] h-[18px] flex-shrink-0 text-[#4CAF50]", isTimerActive && "animate-pulse")} />
            {displayTime}
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

        {/* Нижняя строка: название проекта слева, статус, аватарки автора и участников справа (overlap) */}
        <div className="flex items-center gap-2 min-h-[32px]">
          {task.projectTitle ? (
            <span className="text-[12px] text-[#A0A0A0] truncate flex-1 min-w-0">
              {task.projectTitle}
            </span>
          ) : (
            <span className="flex-1 min-w-0" />
          )}
          
          {/* Тип задачи */}
          {task.type && (
            <div className="flex-shrink-0">
              {task.type === 'urgent' && <Flame className="w-4 h-4 text-[#EF4444]" />}
              {task.type === 'discuss' && <MessageSquare className="w-4 h-4 text-[#3B82F6]" />}
              {task.type === 'wait' && <Hourglass className="w-4 h-4 text-[#F59E0B]" />}
              {task.type === 'fix' && <Bug className="w-4 h-4 text-[#EC4899]" />}
              {task.type === 'idea' && <Lightbulb className="w-4 h-4 text-[#EAB308]" />}
            </div>
          )}

          <span
            className={cn(
              "px-2 py-1 rounded-md text-[11px] font-medium flex-shrink-0 whitespace-nowrap",
              STATUS_CONFIG[task.status as TaskStatus]?.bgColor || STATUS_CONFIG.todo.bgColor,
              STATUS_CONFIG[task.status as TaskStatus]?.textColor || STATUS_CONFIG.todo.textColor
            )}
          >
            {STATUS_CONFIG[task.status as TaskStatus]?.label || STATUS_CONFIG.todo.label}
          </span>
          <TaskAvatars task={task} />
        </div>
      </motion.div>
    </motion.div>
  );
}
