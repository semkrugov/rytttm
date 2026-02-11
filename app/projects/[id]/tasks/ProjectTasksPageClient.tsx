"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Search, Plus } from "lucide-react";
import AppHeader from "@/components/AppHeader";
import BottomNavigation from "@/components/BottomNavigation";
import StatusTabs, { type TasksPageFilter } from "@/components/StatusTabs";
import TasksListCard from "@/components/TasksListCard";
import { Task, TaskStatus } from "@/types";
import { supabase } from "@/lib/supabase";
import { haptics } from "@/lib/telegram";
import { useTelegramAuth } from "@/hooks/useTelegramAuth";
import { cn } from "@/lib/utils";

const DEMO_PROJECTS: Record<string, { id: string; title: string }> = {
  "demo-work": { id: "demo-work", title: "Рабочий чат" },
  "demo-life": { id: "demo-life", title: "Личные дела" },
};

const DEMO_TASKS: Task[] = [
  {
    id: "demo-1",
    title: "Сверстать демо-экран",
    project: "demo-work",
    projectTitle: "Рабочий чат",
    deadline: undefined,
    status: "doing",
    completed: false,
    assignee: null,
  },
  {
    id: "demo-2",
    title: "Подключить платежи",
    project: "demo-work",
    projectTitle: "Рабочий чат",
    deadline: undefined,
    status: "todo",
    completed: false,
    assignee: null,
  },
  {
    id: "demo-3",
    title: "Покормить кота",
    project: "demo-life",
    projectTitle: "Личные дела",
    deadline: undefined,
    status: "todo",
    completed: false,
    assignee: null,
  },
];

function formatTimeTracking(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
}

type TaskRow = {
  id: string;
  title: string;
  project_id: string;
  projects?: { title?: string } | null;
  deadline: string | null;
  status: string;
  time_tracking: number | null;
  is_tracking: boolean | null;
  creator_id: string | null;
  assignee_id: string | null;
  task_type: string | null;
  creator?: { username: string | null; avatar_url: string | null } | null;
  assignee?: { username: string | null; avatar_url: string | null } | null;
};

interface ProjectTasksPageClientProps {
  projectId: string;
}

export default function ProjectTasksPageClient({ projectId }: ProjectTasksPageClientProps) {
  const router = useRouter();
  const { user, loading: authLoading, isDemoMode } = useTelegramAuth();
  const [projectTitle, setProjectTitle] = useState<string>("");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<TasksPageFilter>("all");
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!projectId) return;
    if (projectId.startsWith("demo-") && DEMO_PROJECTS[projectId]) {
      setProjectTitle(DEMO_PROJECTS[projectId].title);
      setTasks(DEMO_TASKS.filter((t) => t.project === projectId));
      setLoading(false);
      return;
    }
    if (user?.id) {
      loadProjectAndTasks();
    } else {
      setLoading(false);
    }
  }, [projectId, authLoading, user?.id]);

  useEffect(() => {
    if (!user?.id || !projectId || projectId.startsWith("demo-")) return;
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }
    const channel = supabase
      .channel(`project-tasks:${projectId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tasks", filter: `project_id=eq.${projectId}` },
        () => loadProjectAndTasks()
      )
      .subscribe();
    channelRef.current = channel;
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [user?.id, projectId]);

  const loadProjectAndTasks = async () => {
    if (!user?.id || !projectId) return;
    try {
      setLoading(true);
      const [projectRes, tasksRes] = await Promise.all([
        supabase.from("projects").select("title").eq("id", projectId).single(),
        supabase
          .from("tasks")
          .select("*, projects(title), assignee:profiles!assignee_id(username, avatar_url), creator:profiles!creator_id(username, avatar_url)")
          .eq("project_id", projectId)
          .order("created_at", { ascending: false }),
      ]);
      if (projectRes.data) setProjectTitle(projectRes.data.title || "");
      if (tasksRes.error) throw tasksRes.error;
      const data = tasksRes.data || [];
      const formattedTasks: Task[] = data.map((task: TaskRow) => ({
        id: task.id,
        title: task.title,
        project: task.project_id,
        projectTitle: task.projects?.title || "",
        deadline: task.deadline ? new Date(task.deadline).toLocaleDateString("ru-RU") : undefined,
        deadlineTime: task.deadline
          ? `${new Date(task.deadline).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })} | ${new Date(task.deadline).toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit" })}`
          : undefined,
        status: (task.status as TaskStatus) || "todo",
        timeTracking: task.time_tracking ? formatTimeTracking(task.time_tracking) : undefined,
        isTracking: task.is_tracking || false,
        completed: task.status === "done",
        author: task.creator || null,
        assignee: task.assignee || null,
        creatorId: task.creator_id ?? null,
        assigneeId: task.assignee_id ?? null,
        type: (task.task_type as Task['type']) || null,
      }));
      setTasks(formattedTasks);
    } catch (e) {
      console.error("Error loading project tasks:", e);
    } finally {
      setLoading(false);
    }
  };

  const filteredTasks = useMemo(() => {
    let list = tasks;
    const q = searchQuery.trim().toLowerCase();
    if (q) list = list.filter((t) => t.title.toLowerCase().includes(q));
    return list.filter((task) => {
      const taskStatus = task.status || "todo";
      if (activeFilter === "all") return taskStatus !== "done";
      return taskStatus === activeFilter;
    });
  }, [tasks, searchQuery, activeFilter]);

  const handleStatusChange = async (taskId: string, newStatus: TaskStatus) => {
    setUpdating(taskId);
    const completed = newStatus === "done";
    if (taskId.startsWith("demo-")) {
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, status: newStatus, completed } : t))
      );
      if (completed) setTimeout(() => setTasks((prev) => prev.filter((t) => t.id !== taskId)), 500);
      setUpdating(null);
      return;
    }
    try {
      if (completed) await new Promise<void>((r) => setTimeout(r, 500));
      const { error } = await supabase.from("tasks").update({ status: newStatus }).eq("id", taskId);
      if (error) throw error;
      if (completed) setTasks((prev) => prev.filter((t) => t.id !== taskId));
      else setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status: newStatus, completed } : t)));
    } catch (e) {
      console.error("Error updating task:", e);
    } finally {
      setUpdating(null);
    }
  };

  const handleAddTask = () => {
    haptics.medium();
    router.push(`/projects/${projectId}/add-task`);
  };

  const showSkeleton = authLoading || (loading && !isDemoMode);

  return (
    <div className="min-h-screen bg-[rgba(35,36,39,1)]">
      <main
        className="mx-auto max-w-[390px] py-4 pb-24 px-[18px]"
        style={{ paddingBottom: "calc(6rem + env(safe-area-inset-bottom))" }}
      >
        <motion.div
          initial={false}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, ease: [0.19, 1, 0.22, 1] }}
          className="flex flex-col gap-[18px]"
        >
          <AppHeader
            leftSlot={
              <button
                type="button"
                onClick={() => router.back()}
                className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center active:opacity-80 transition-opacity"
              >
                <ArrowLeft className="w-5 h-5 text-[#151617]" strokeWidth={2} />
              </button>
            }
          />

          {/* Название проекта */}
          <h1 className="text-[22px] font-medium text-white truncate">
            {projectTitle || "Задачи проекта"}
          </h1>

          {/* Поиск */}
          <div className="flex items-center gap-3 h-12 px-4 rounded-[14px] bg-[#1E1F22]">
            <Search className="w-5 h-5 text-[#9097A7] flex-shrink-0" strokeWidth={2} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Поиск"
              className="flex-1 min-w-0 bg-transparent text-white text-[16px] placeholder:text-[#9097A7] outline-none"
            />
          </div>

          {/* Табы */}
          <div className="rounded-[14px] overflow-hidden">
            <div className="p-0">
              <StatusTabs
                activeStatus={activeFilter}
                onStatusChange={(s: TasksPageFilter) => setActiveFilter(s)}
                embedded
                variant="tasks"
              />
            </div>

            <AnimatePresence mode="wait">
              {showSkeleton ? (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col"
                >
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className={cn(
                        "flex items-center gap-3 px-[18px] py-[18px] animate-pulse",
                        i < 4 && "border-b border-[#28292D]"
                      )}
                    >
                      <div className="w-[25px] h-[25px] rounded-lg bg-[#28292D]" />
                      <div className="flex-1 min-w-0">
                        <div className="h-4 bg-[#28292D] rounded w-3/4 mb-2" />
                        <div className="h-3 bg-[#28292D]/70 rounded w-20" />
                      </div>
                    </div>
                  ))}
                </motion.div>
              ) : (
                <motion.div
                  key="content"
                  initial={false}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3, ease: [0.19, 1, 0.22, 1] }}
                >
                  {filteredTasks.length > 0 ? (
                    <div className="flex flex-col justify-center items-center px-0 py-4">
                      <AnimatePresence mode="sync" initial={false}>
                        {filteredTasks.map((task, index) => (
                          <TasksListCard
                            key={task.id}
                            task={task}
                            isLast={index === filteredTasks.length - 1}
                            onStatusChange={handleStatusChange}
                          />
                        ))}
                      </AnimatePresence>
                    </div>
                  ) : (
                    <div className="text-center py-10 px-4">
                      <p className="text-sm text-[#9097A7]">
                        {searchQuery.trim()
                          ? "Ничего не найдено"
                          : "Нет задач в этом статусе"}
                      </p>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <motion.button
            onClick={handleAddTask}
            className="fixed bottom-24 right-[18px] w-14 h-14 rounded-full flex items-center justify-center shadow-lg z-40"
            style={{
              background: "linear-gradient(90deg, #C3CBFF 0%, #F6B3FF 100%)",
              bottom: "calc(6rem + env(safe-area-inset-bottom))",
            }}
            whileTap={{ scale: 0.9 }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 30,
            }}
          >
            <Plus className="w-6 h-6 text-white" strokeWidth={3} />
          </motion.button>
        </motion.div>
      </main>
      <BottomNavigation />
    </div>
  );
}
