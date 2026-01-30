"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Paperclip,
  MessageCircle,
  Calendar,
  Play,
  Square,
  Link2,
} from "lucide-react";
import AppHeader from "@/components/AppHeader";
import { supabase } from "@/lib/supabase";
import { haptics } from "@/lib/telegram";
import { useHasAnimated } from "@/hooks/useHasAnimated";

interface TaskDetail {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  deadline: string | null;
  assignee_id: string | null;
  creator_id: string | null;
  project_id: string | null;
  confidence_score: number | null;
  time_tracking: number | null;
  is_tracking: boolean | null;
}

interface AssigneeProfile {
  id: string;
  username: string | null;
  avatar_url: string | null;
  position?: string | null;
}

interface TaskDetailPageClientProps {
  taskId: string;
}

export default function TaskDetailPageClient({ taskId }: TaskDetailPageClientProps) {
  const router = useRouter();
  const hasAnimated = useHasAnimated();

  const [task, setTask] = useState<TaskDetail | null>(null);
  const [assignee, setAssignee] = useState<AssigneeProfile | null>(null);
  const [creator, setCreator] = useState<AssigneeProfile | null>(null);
  const [projectTitle, setProjectTitle] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isTracking, setIsTracking] = useState(false);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (taskId) loadTask();
  }, [taskId]);

  useEffect(() => {
    if (isTracking) {
      intervalRef.current = setInterval(() => setTimeElapsed((p) => p + 1), 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isTracking]);

  const DEMO_TASKS: Record<string, TaskDetail> = {
    "demo-1": {
      id: "demo-1",
      title: "Сверстать демо-экран",
      description: null,
      status: "doing",
      priority: "medium",
      deadline: null,
      assignee_id: null,
      creator_id: null,
      project_id: null,
      confidence_score: null,
      time_tracking: 0,
      is_tracking: false,
    },
    "demo-2": {
      id: "demo-2",
      title: "Подключить платежи",
      description: null,
      status: "todo",
      priority: "medium",
      deadline: null,
      assignee_id: null,
      creator_id: null,
      project_id: null,
      confidence_score: null,
      time_tracking: 0,
      is_tracking: false,
    },
    "demo-3": {
      id: "demo-3",
      title: "Покормить кота",
      description: null,
      status: "todo",
      priority: "medium",
      deadline: null,
      assignee_id: null,
      creator_id: null,
      project_id: null,
      confidence_score: null,
      time_tracking: 0,
      is_tracking: false,
    },
  };

  async function loadTask() {
    try {
      setLoading(true);

      if (taskId.startsWith("demo-") && DEMO_TASKS[taskId]) {
        setTask(DEMO_TASKS[taskId]);
        setLoading(false);
        return;
      }

      const { data: taskData, error: taskError } = await supabase
        .from("tasks")
        .select("*, projects(title)")
        .eq("id", taskId)
        .single();

      if (taskError) throw taskError;
      if (!taskData) throw new Error("Task not found");

      const projectTitleFromApi = (taskData as { projects?: { title: string } }).projects?.title ?? null;
      setTask({ ...taskData, project_id: taskData.project_id ?? null } as TaskDetail);
      setProjectTitle(projectTitleFromApi);
      setIsTracking(taskData.is_tracking || false);
      setTimeElapsed(taskData.time_tracking || 0);

      if (taskData.assignee_id) {
        const { data: assigneeData } = await supabase
          .from("profiles")
          .select("id, username, avatar_url")
          .eq("id", taskData.assignee_id)
          .single();
        if (assigneeData) setAssignee(assigneeData as AssigneeProfile);
      }
      if (taskData.creator_id) {
        const { data: creatorData } = await supabase
          .from("profiles")
          .select("id, username, avatar_url")
          .eq("id", taskData.creator_id)
          .single();
        if (creatorData) setCreator(creatorData as AssigneeProfile);
      }
    } catch (e) {
      console.error("Error loading task:", e);
    } finally {
      setLoading(false);
    }
  }

  async function handleTimeTrackingToggle() {
    if (!task) return;
    haptics.medium();
    const newIsTracking = !isTracking;

    if (newIsTracking) {
      try {
        await supabase.from("tasks").update({ is_tracking: true }).eq("id", taskId);
        setIsTracking(true);
      } catch (e) {
        console.error("Error starting time tracking:", e);
      }
    } else {
      setIsTracking(false);
      try {
        await supabase
          .from("tasks")
          .update({ is_tracking: false, time_tracking: timeElapsed })
          .eq("id", taskId);
      } catch (e) {
        console.error("Error stopping time tracking:", e);
        setIsTracking(true);
      }
    }
  }

  function formatTimeShort(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  }

  function formatDeadlineRu(deadline: string | null): string {
    if (!deadline) return "";
    const d = new Date(deadline);
    const time = d.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
    const date = d.toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit" });
    return `${time} | ${date}`;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[rgba(35,36,39,1)] flex items-center justify-center">
        <div className="text-white">Загрузка...</div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="min-h-screen bg-[rgba(35,36,39,1)] flex items-center justify-center">
        <div className="text-white">Задача не найдена</div>
      </div>
    );
  }

  const deadlineStr = formatDeadlineRu(task.deadline);
  const timerStr = formatTimeShort(timeElapsed);

  return (
    <motion.div
      initial={hasAnimated ? false : { opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={
        hasAnimated ? { duration: 0 } : { duration: 0.35, ease: [0.19, 1, 0.22, 1] }
      }
      className="min-h-screen bg-[rgba(35,36,39,1)]"
    >
      <AppHeader
        leftSlot={
          <button
            onClick={() => router.back()}
            className="w-10 h-10 rounded-full bg-[#1E1F22] flex items-center justify-center active:opacity-80 transition-opacity"
          >
            <ArrowLeft className="w-5 h-5 text-white" strokeWidth={2} />
          </button>
        }
        rightSlot={
          <div className="flex items-center gap-2">
            <button className="w-10 h-10 rounded-full bg-[#1E1F22] flex items-center justify-center">
              <Paperclip className="w-5 h-5 text-white" strokeWidth={2} />
            </button>
            <button className="w-10 h-10 rounded-full bg-[#1E1F22] flex items-center justify-center">
              <MessageCircle className="w-5 h-5 text-white" strokeWidth={2} />
            </button>
          </div>
        }
      />

      <main
        className="mx-auto max-w-[390px] px-[18px] pb-24"
        style={{ paddingBottom: "calc(6rem + env(safe-area-inset-bottom))" }}
      >
        {/* Дата и время дедлайна */}
        {deadlineStr && (
          <div className="flex items-center gap-2 text-[#9097A7] text-sm mb-2">
            <Calendar className="w-4 h-4 flex-shrink-0" strokeWidth={2} />
            <span>{deadlineStr}</span>
          </div>
        )}

        {/* Заголовок */}
        <h1 className="text-[22px] font-medium text-white leading-tight mb-2">
          {task.title}
        </h1>
        {task.description && (
          <p className="text-sm text-[#9097A7] leading-snug mb-6">
            {task.description}
          </p>
        )}

        {/* Таймер / воспроизведение */}
        <div className="flex items-center gap-4 mb-8">
          <motion.button
            type="button"
            onClick={handleTimeTrackingToggle}
            className="w-14 h-14 rounded-full border-2 border-[#22c55e] flex items-center justify-center bg-transparent flex-shrink-0"
            whileTap={{ scale: 0.96 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            {isTracking ? (
              <Square
                className="w-6 h-6 text-[#22c55e]"
                strokeWidth={2}
                fill="currentColor"
              />
            ) : (
              <Play
                className="w-6 h-6 text-[#22c55e] ml-0.5"
                strokeWidth={2}
                fill="currentColor"
              />
            )}
          </motion.button>
          <span className="text-2xl font-bold text-[#22c55e] tabular-nums">
            {timerStr}
          </span>
        </div>

        {/* Выполняет */}
        <div className="mb-6">
          <p className="text-sm text-[#9097A7] mb-2">Выполняет</p>
          <div className="rounded-[14px] bg-[#1E1F22] overflow-hidden">
            <div className="flex items-center gap-3 px-4 py-3">
              {assignee?.avatar_url ? (
                <img
                  src={assignee.avatar_url}
                  alt=""
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-[#3B82F6] flex items-center justify-center text-white text-sm font-medium">
                  {(assignee?.username || "?")[0].toUpperCase()}
                </div>
              )}
              <span className="text-white font-medium truncate">
                {assignee?.username ?? "Не назначен"}
              </span>
            </div>
          </div>
        </div>

        {/* Ответственный */}
        <div className="mb-6">
          <p className="text-sm text-[#9097A7] mb-2">Ответственный</p>
          <div className="rounded-[14px] bg-[#1E1F22] overflow-hidden">
            <div className="flex items-center gap-3 px-4 py-3">
              {creator?.avatar_url ? (
                <img
                  src={creator.avatar_url}
                  alt=""
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-[#F97316] flex items-center justify-center text-white text-sm font-medium">
                  {(creator?.username || "?")[0].toUpperCase()}
                </div>
              )}
              <span className="text-white font-medium truncate">
                {creator?.username ?? "—"}
              </span>
            </div>
          </div>
        </div>

        {/* Дополнительно */}
        <div>
          <p className="text-sm text-[#9097A7] mb-2">Дополнительно</p>
          <div className="space-y-2">
            {projectTitle && (
              <div className="rounded-[14px] bg-[#1E1F22] overflow-hidden">
                <div className="flex items-center gap-3 px-4 py-3">
                  <div className="w-10 h-10 rounded-full bg-[#3B82F6] flex items-center justify-center text-white text-sm font-medium">
                    T
                  </div>
                  <span className="text-white font-medium truncate">
                    {projectTitle}
                  </span>
                </div>
              </div>
            )}
            {/* Плейсхолдер файла — можно заменить на реальные вложения */}
            <div className="rounded-[14px] bg-[#1E1F22] overflow-hidden">
              <div className="flex items-center gap-3 px-4 py-3">
                <Link2 className="w-5 h-5 text-[#9097A7] flex-shrink-0" strokeWidth={2} />
                <span className="text-white font-medium truncate">File_name.pdf</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </motion.div>
  );
}
