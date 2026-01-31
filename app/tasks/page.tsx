"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { motion, AnimatePresence } from "framer-motion";
import { Plus } from "lucide-react";
import AppHeader from "@/components/AppHeader";
import BottomNavigation from "@/components/BottomNavigation";
import StatusTabs, { type TasksPageFilter } from "@/components/StatusTabs";
import TasksListCard from "@/components/TasksListCard";
import { Task, TaskStatus } from "@/types";
import { supabase } from "@/lib/supabase";
import { animationVariants } from "@/lib/animations";
import { cn } from "@/lib/utils";
import { haptics } from "@/lib/telegram";
import { useTelegramAuth } from "@/hooks/useTelegramAuth";

const demoTasks: Task[] = [
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

export default function TasksPage() {
  const router = useRouter();
  const { user, loading: authLoading, isDemoMode } = useTelegramAuth();
  const [activeFilter, setActiveFilter] = useState<TasksPageFilter>("all");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (user) {
      loadTasks();
    } else {
      setTasks(demoTasks);
      setLoading(false);
    }
  }, [authLoading, user?.id]);

  useEffect(() => {
    if (!user) return;
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }
    const channel = supabase
      .channel("public:tasks")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tasks" },
        () => loadTasks()
      )
      .subscribe();
    channelRef.current = channel;
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [user?.id]);

  const loadTasks = async () => {
    if (!user?.id) return;
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("tasks")
        .select("*, projects(title), assignee:profiles!assignee_id(username, avatar_url), creator:profiles!creator_id(username, avatar_url)")
        .order("created_at", { ascending: false });

      if (error) throw error;

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
        creator?: { username: string | null; avatar_url: string | null } | null;
        assignee?: { username: string | null; avatar_url: string | null } | null;
      };
      const formattedTasks: Task[] = (data || []).map((task: TaskRow) => ({
        id: task.id,
        title: task.title,
        project: task.project_id,
        projectTitle: task.projects?.title || "Без проекта",
        deadline: task.deadline
          ? new Date(task.deadline).toLocaleDateString("ru-RU")
          : undefined,
        deadlineTime: task.deadline
          ? `${new Date(task.deadline).toLocaleTimeString("ru-RU", {
              hour: "2-digit",
              minute: "2-digit",
            })} | ${new Date(task.deadline).toLocaleDateString("ru-RU", {
              day: "2-digit",
              month: "2-digit",
            })}`
          : undefined,
        status: (task.status as TaskStatus) || "todo",
        timeTracking: task.time_tracking
          ? formatTimeTracking(task.time_tracking)
          : undefined,
        isTracking: task.is_tracking || false,
        completed: task.status === "done",
        author: task.creator || null,
        assignee: task.assignee || null,
        creatorId: task.creator_id ?? null,
        assigneeId: task.assignee_id ?? null,
      }));

      setTasks(formattedTasks);
    } catch (error) {
      console.error("Error loading tasks:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatTimeTracking = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}`;
  };

  const filteredTasks = tasks.filter((task) => {
    const taskStatus = task.status || "todo";
    if (activeFilter === "all") return taskStatus !== "done";
    return taskStatus === activeFilter;
  });

  const handleStatusChange = async (taskId: string, newStatus: TaskStatus) => {
    setUpdating(taskId);
    const completed = newStatus === "done";

    if (taskId.startsWith("demo-")) {
      setTasks((prev) =>
        prev.map((t) =>
          t.id === taskId ? { ...t, status: newStatus, completed } : t
        )
      );
      if (completed) {
        setTimeout(() => {
          setTasks((prev) => prev.filter((t) => t.id !== taskId));
        }, 500);
      }
      setUpdating(null);
      return;
    }

    try {
      if (completed) {
        await new Promise<void>((resolve) => setTimeout(resolve, 500));
      }
      const { error } = await supabase
        .from("tasks")
        .update({ status: newStatus })
        .eq("id", taskId);

      if (error) throw error;

      if (completed) {
        setTasks((prev) => prev.filter((t) => t.id !== taskId));
      } else {
        setTasks((prev) =>
          prev.map((t) =>
            t.id === taskId ? { ...t, status: newStatus, completed } : t
          )
        );
      }
    } catch (error) {
      console.error("Error updating task status:", error);
    } finally {
      setUpdating(null);
    }
  };

  const handleAddTask = () => {
    haptics.medium();
    router.push("/tasks/add");
  };

  const showSkeleton = authLoading || (loading && !isDemoMode);

  return (
    <div className="min-h-screen bg-[rgba(35,36,39,1)]">
      <main
        className="mx-auto max-w-[390px] py-4 pb-24"
        style={{
          paddingBottom: "calc(6rem + env(safe-area-inset-bottom))",
        }}
      >
        <motion.div
          initial={false}
          animate={{ opacity: 1 }}
          transition={
            { duration: 0.3, ease: [0.19, 1, 0.22, 1] }
          }
          className="flex flex-col gap-[18px]"
        >
          <AppHeader />
          <section className="space-y-3 px-[18px]">
            <h1 className="text-[22px] font-medium text-white">
              Задачи
            </h1>

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
                          Нет задач в этом статусе
                        </p>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </section>

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
