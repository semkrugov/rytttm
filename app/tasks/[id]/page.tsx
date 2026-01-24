"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Paperclip,
  MessageCircle,
  Calendar,
  Play,
  Square,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { haptics } from "@/lib/telegram";
import { cn } from "@/lib/utils";

interface TaskDetail {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  deadline: string | null;
  assignee_id: string | null;
  creator_id: string | null;
  confidence_score: number | null;
  time_tracking: number | null;
  is_tracking: boolean | null;
}

interface AssigneeProfile {
  id: string;
  username: string | null;
  avatar_url: string | null;
  display_name: string | null;
  position: string | null;
}

const STATUS_MAP: Record<string, string> = {
  todo: "TODO",
  doing: "IN PROGRESS",
  done: "DONE",
};

const STATUS_REVERSE_MAP: Record<string, string> = {
  TODO: "todo",
  "IN PROGRESS": "doing",
  DONE: "done",
};

export default function TaskDetailPage() {
  const router = useRouter();
  const params = useParams();
  const taskId = params.id as string;

  const [task, setTask] = useState<TaskDetail | null>(null);
  const [assignee, setAssignee] = useState<AssigneeProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [isTracking, setIsTracking] = useState(false);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Загрузка данных задачи
  useEffect(() => {
    if (taskId) {
      loadTask();
    }
  }, [taskId]);

  // Таймер для time tracking
  useEffect(() => {
    if (isTracking) {
      intervalRef.current = setInterval(() => {
        setTimeElapsed((prev) => prev + 1);
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isTracking]);

  const loadTask = async () => {
    try {
      setLoading(true);

      // Загружаем задачу
      const { data: taskData, error: taskError } = await supabase
        .from("tasks")
        .select("*")
        .eq("id", taskId)
        .single();

      if (taskError) throw taskError;
      if (!taskData) {
        throw new Error("Task not found");
      }

      setTask(taskData as TaskDetail);
      setIsTracking(taskData.is_tracking || false);
      setTimeElapsed(taskData.time_tracking || 0);

      // Загружаем профиль исполнителя, если есть
      if (taskData.assignee_id) {
        const { data: assigneeData, error: assigneeError } = await supabase
          .from("profiles")
          .select("id, username, avatar_url, display_name")
          .eq("id", taskData.assignee_id)
          .single();

        if (!assigneeError && assigneeData) {
          setAssignee(assigneeData as AssigneeProfile);
        }
      }
    } catch (error) {
      console.error("Error loading task:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!task || updating) return;

    try {
      setUpdating(true);
      haptics.light();

      const statusValue = STATUS_REVERSE_MAP[newStatus] || newStatus.toLowerCase();

      const { error } = await supabase
        .from("tasks")
        .update({ status: statusValue })
        .eq("id", taskId);

      if (error) throw error;

      setTask({ ...task, status: statusValue });
    } catch (error) {
      console.error("Error updating status:", error);
    } finally {
      setUpdating(false);
    }
  };

  const handleTimeTrackingToggle = async () => {
    if (!task) return;

    const newIsTracking = !isTracking;

    if (newIsTracking) {
      // Запуск таймера (Play)
      haptics.medium();
      
      try {
        // Сначала обновляем is_tracking на true в базе
        const { error } = await supabase
          .from("tasks")
          .update({
            is_tracking: true,
          })
          .eq("id", taskId);

        if (error) throw error;

        // Затем запускаем локальный счетчик
        setIsTracking(true);
      } catch (error) {
        console.error("Error starting time tracking:", error);
      }
    } else {
      // Остановка таймера (Stop)
      haptics.medium();
      
      try {
        // Сначала останавливаем локальный счетчик
        setIsTracking(false);

        // Затем сохраняем накопленные секунды в базу
        const { error } = await supabase
          .from("tasks")
          .update({
            is_tracking: false,
            time_tracking: timeElapsed,
          })
          .eq("id", taskId);

        if (error) throw error;
      } catch (error) {
        console.error("Error stopping time tracking:", error);
        // Восстанавливаем состояние при ошибке
        setIsTracking(true);
      }
    }
  };

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const formatDeadline = (deadline: string | null): string => {
    if (!deadline) return "No deadline";
    const date = new Date(deadline);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--tg-theme-bg-color)] flex items-center justify-center">
        <div className="text-[var(--tg-theme-text-color)]">Loading...</div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="min-h-screen bg-[var(--tg-theme-bg-color)] flex items-center justify-center">
        <div className="text-[var(--tg-theme-text-color)]">Task not found</div>
      </div>
    );
  }

  const currentStatus = STATUS_MAP[task.status] || task.status.toUpperCase();
  const statuses = ["TODO", "IN PROGRESS", "DONE"];

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -50 }}
      transition={{
        duration: 0.4,
        ease: [0.19, 1, 0.22, 1],
      }}
      className="min-h-screen bg-[var(--tg-theme-bg-color)]"
    >
      {/* Top Navigation Bar */}
      <div className="flex items-center justify-between px-4 pt-4 pb-6">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-lg hover:bg-[var(--tg-theme-secondary-bg-color)] transition-colors"
        >
          <ArrowLeft
            className="w-6 h-6 text-[var(--tg-theme-text-color)]"
            strokeWidth={2}
          />
        </button>

        <div className="flex items-center gap-2">
          <button className="p-2 rounded-lg bg-[var(--tg-theme-secondary-bg-color)]">
            <Paperclip
              className="w-5 h-5 text-[var(--tg-theme-text-color)]"
              strokeWidth={2}
            />
          </button>
          <button className="p-2 rounded-lg bg-[var(--tg-theme-secondary-bg-color)]">
            <MessageCircle
              className="w-5 h-5 text-[var(--tg-theme-text-color)]"
              strokeWidth={2}
            />
          </button>
        </div>
      </div>

      <main className="container mx-auto px-4 pb-24">
        {/* Task Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-[var(--tg-theme-text-color)] mb-3">
            {task.title}
          </h1>
          <p className="text-base text-[var(--tg-theme-hint-color)]">
            {task.description || "No description"}
          </p>
        </div>

        {/* Status Selector */}
        <div className="mb-6">
          <label className="text-xs uppercase text-[var(--tg-theme-hint-color)] mb-2 block">
            STATUS
          </label>
          <div className="flex gap-1 p-1 bg-[var(--tg-theme-secondary-bg-color)] rounded-xl">
            {statuses.map((status) => {
              const isActive = status === currentStatus;
              return (
                <button
                  key={status}
                  onClick={() => handleStatusChange(status)}
                  disabled={updating}
                  className={cn(
                    "flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all",
                    isActive
                      ? "bg-[var(--tg-theme-button-color)] text-white"
                      : "text-[var(--tg-theme-hint-color)] hover:text-[var(--tg-theme-text-color)]"
                  )}
                >
                  {status}
                </button>
              );
            })}
          </div>
        </div>

        {/* Grid of Two Cards */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          {/* Assignee Card */}
          <div className="bg-[var(--tg-theme-secondary-bg-color)] rounded-xl p-4">
            <label className="text-xs uppercase text-[var(--tg-theme-hint-color)] mb-2 block">
              ASSIGNEE
            </label>
            {assignee ? (
              <div className="flex items-center gap-2">
                {assignee.avatar_url ? (
                  <img
                    src={assignee.avatar_url}
                    alt={assignee.username || "User"}
                    className="w-8 h-8 rounded-full"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-[var(--tg-theme-button-color)] flex items-center justify-center">
                    <span className="text-white text-xs font-medium">
                      {(assignee.username || assignee.display_name || "U")[0].toUpperCase()}
                    </span>
                  </div>
                )}
                <span className="text-sm text-[var(--tg-theme-text-color)]">
                  {assignee.username
                    ? `@${assignee.username}`
                    : assignee.display_name || "Unassigned"}
                </span>
              </div>
            ) : (
              <span className="text-sm text-[var(--tg-theme-hint-color)]">
                Unassigned
              </span>
            )}
          </div>

          {/* Deadline Card */}
          <div className="bg-[var(--tg-theme-secondary-bg-color)] rounded-xl p-4">
            <label className="text-xs uppercase text-[var(--tg-theme-hint-color)] mb-2 block">
              DEADLINE
            </label>
            <div className="flex items-center gap-2">
              <Calendar
                className="w-5 h-5 text-[var(--tg-theme-hint-color)]"
                strokeWidth={2}
              />
              <span className="text-sm text-[var(--tg-theme-text-color)]">
                {formatDeadline(task.deadline)}
              </span>
            </div>
          </div>
        </div>

        {/* Time Tracking Block */}
        <div className="bg-[var(--tg-theme-secondary-bg-color)] rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-[var(--tg-theme-text-color)]">
              Time Tracking
            </h2>
            <span className="text-xs font-bold px-2.5 py-1 bg-[var(--tg-theme-button-color)] text-white rounded-full">
              Estimated: 4h
            </span>
          </div>

          {/* Timer Display */}
          <div className="text-center mb-6">
            <div className="text-5xl font-bold text-[var(--tg-theme-text-color)] mb-4">
              {formatTime(timeElapsed)}
            </div>
          </div>

          {/* Control Buttons */}
          <div className="flex items-center justify-end gap-3">
            {isTracking ? (
              <button
                onClick={handleTimeTrackingToggle}
                className="w-14 h-14 rounded-full bg-[var(--tg-theme-secondary-bg-color)] border-2 border-[var(--tg-theme-hint-color)] flex items-center justify-center hover:bg-[var(--tg-theme-bg-color)] transition-colors"
              >
                <Square
                  className="w-6 h-6 text-[var(--tg-theme-text-color)]"
                  strokeWidth={2}
                  fill="currentColor"
                />
              </button>
            ) : (
              <button
                onClick={handleTimeTrackingToggle}
                className="w-14 h-14 rounded-full bg-[var(--tg-theme-button-color)] flex items-center justify-center hover:opacity-90 transition-opacity shadow-lg"
              >
                <Play
                  className="w-6 h-6 text-white ml-0.5"
                  strokeWidth={2}
                  fill="currentColor"
                />
              </button>
            )}
          </div>
        </div>
      </main>
    </motion.div>
  );
}
