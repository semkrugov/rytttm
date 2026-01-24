"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, useMotionValue, useTransform, PanInfo } from "framer-motion";
import { Play, Pause, Calendar, Check } from "lucide-react";
import { Task, TaskStatus } from "@/types";
import { haptics } from "@/lib/telegram";
import { cn, generateColorFromString } from "@/lib/utils";
import { animationVariants } from "@/lib/animations";
import { useHasAnimated } from "@/hooks/useHasAnimated";

interface TaskCardProps {
  task: Task;
  onStatusChange: (taskId: string, newStatus: TaskStatus) => void;
  onTimeTrackingToggle?: (taskId: string) => void;
}

const SWIPE_THRESHOLD = 80; // Минимальное расстояние свайпа для показа кнопки
const ACTION_BUTTON_WIDTH = 80; // Ширина кнопки действия

export default function TaskCard({
  task,
  onStatusChange,
  onTimeTrackingToggle,
}: TaskCardProps) {
  const hasAnimated = useHasAnimated();
  const [isDragging, setIsDragging] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const x = useMotionValue(0);
  
  // Ограничиваем свайп только влево (отрицательные значения)
  const clampedX = useTransform(x, (latest) => Math.min(0, latest));
  
  // Прозрачность кнопки действия
  const actionOpacity = useTransform(
    clampedX,
    [0, -SWIPE_THRESHOLD],
    [0, 1]
  );
  
  // Масштаб кнопки при появлении
  const actionScale = useTransform(
    clampedX,
    [0, -SWIPE_THRESHOLD],
    [0.8, 1]
  );

  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const swipeDistance = Math.abs(info.offset.x);

    if (swipeDistance > SWIPE_THRESHOLD && info.offset.x < 0) {
      // Свайп влево достаточно далеко - завершить задачу
      if (typeof window !== "undefined") {
        haptics.success();
      }
      setIsCompleting(true);
      
      // Анимация завершения
      setTimeout(() => {
        onStatusChange(task.id, "done");
        x.set(0);
        setIsCompleting(false);
      }, 300);
    } else {
      // Возврат в исходное положение
      x.set(0);
    }
    setIsDragging(false);
  };

  const handleDragStart = () => {
    setIsDragging(true);
  };

  const handleActionClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (typeof window !== "undefined") {
      haptics.success();
    }
    setIsCompleting(true);
    
    // Анимация завершения
    setTimeout(() => {
      onStatusChange(task.id, "done");
      x.set(0);
      setIsCompleting(false);
    }, 300);
  };

  if (isCompleting) {
    return null;
  }

  return (
    <motion.div
      layout
      variants={hasAnimated ? undefined : animationVariants.staggerItem}
      initial={hasAnimated ? false : "initial"}
      animate="animate"
      exit={{ 
        opacity: 0, 
        x: -300,
        transition: {
          duration: 0.3,
          ease: [0.19, 1, 0.22, 1],
        }
      }}
      className="relative mb-3 overflow-hidden"
      style={{ x: clampedX }}
      drag="x"
      dragConstraints={{ left: -ACTION_BUTTON_WIDTH, right: 0 }}
      dragElastic={0.1}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      whileDrag={{ cursor: "grabbing" }}
    >
      {/* Кнопка действия (слева, появляется при свайпе) */}
      <motion.div
        className="absolute left-0 top-0 bottom-0 w-20 flex items-center justify-center bg-green-500"
        style={{
          opacity: actionOpacity,
          scale: actionScale,
        }}
      >
        <motion.button
          onClick={handleActionClick}
          className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border-2 border-white/30"
          whileTap={{ scale: 0.9 }}
          transition={{
            type: "spring",
            stiffness: 400,
            damping: 25,
          }}
        >
          <Check className="w-6 h-6 text-white" strokeWidth={3} />
        </motion.button>
      </motion.div>

      {/* Основная карточка задачи */}
      <Link href={`/tasks/${task.id}`} className="block">
        <motion.div
          className={cn(
            "bg-[var(--tg-theme-secondary-bg-color)] rounded-xl p-4",
            "relative z-10 cursor-pointer",
            isDragging && "shadow-lg"
          )}
          whileTap={{ scale: 0.98 }}
          initial={hasAnimated ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.1,
            ease: [0.19, 1, 0.22, 1],
          }}
        >
        <div className="flex items-start justify-between mb-3 gap-2">
          <h3 className="text-sm font-medium text-[var(--tg-theme-text-color)] line-clamp-2 flex-1">
            {task.title}
          </h3>
          {/* Бейдж проекта */}
          {task.projectTitle && (
            <motion.span
              className="text-xs px-2 py-0.5 rounded-full text-white font-medium whitespace-nowrap flex-shrink-0"
              style={{
                backgroundColor: generateColorFromString(task.projectTitle),
              }}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{
                duration: 0.2,
                ease: [0.19, 1, 0.22, 1],
              }}
            >
              {task.projectTitle}
            </motion.span>
          )}
        </div>

        <div className="flex items-center justify-between gap-2">
          {/* Исполнитель */}
          <div className="flex items-center gap-2 min-w-0 flex-1">
            {task.assignee ? (
              <>
                {task.assignee.avatar_url ? (
                  <img
                    src={task.assignee.avatar_url}
                    alt={task.assignee.username || "User"}
                    className="w-6 h-6 rounded-full flex-shrink-0"
                  />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-[var(--tg-theme-button-color)] flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-medium text-white">
                      {(task.assignee.username || "U")[0].toUpperCase()}
                    </span>
                  </div>
                )}
                <span className="text-xs text-[var(--tg-theme-text-color)] truncate">
                  {task.assignee.username || "User"}
                </span>
              </>
            ) : (
              <div className="flex items-center gap-1.5">
                <div className="w-6 h-6 rounded-full bg-[var(--tg-theme-hint-color)]/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs text-[var(--tg-theme-hint-color)]">?</span>
                </div>
                <span className="text-xs text-[var(--tg-theme-hint-color)]">Не назначено</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 flex-shrink-0">
            {/* Тайм-трекинг */}
            {task.timeTracking && (
              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onTimeTrackingToggle?.(task.id);
                  }}
                  className="flex items-center gap-1.5 text-sm"
                >
                  {task.isTracking ? (
                    <Pause className="w-4 h-4 text-red-500" />
                  ) : (
                    <Play className="w-4 h-4 text-green-500" />
                  )}
                  <span className="text-[var(--tg-theme-text-color)]">
                    {task.timeTracking}
                  </span>
                </button>
              </div>
            )}

            {/* Дедлайн */}
            {task.deadlineTime && (
              <div className="flex items-center gap-1.5 text-sm text-[var(--tg-theme-hint-color)]">
                <Calendar className="w-4 h-4 text-purple-500" />
                <span>{task.deadlineTime}</span>
              </div>
            )}
          </div>
        </div>
        </motion.div>
      </Link>
    </motion.div>
  );
}
