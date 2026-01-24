"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Loader2 } from "lucide-react";
import BottomNavigation from "@/components/BottomNavigation";
import TaskCard from "@/components/TaskCard";
import TaskCardSkeleton from "@/components/TaskCardSkeleton";
import { Task, TaskStatus } from "@/types";
import { supabase } from "@/lib/supabase";
import { animationVariants } from "@/lib/animations";
import { haptics } from "@/lib/telegram";
import { cn } from "@/lib/utils";

interface ProjectMember {
  user_id: string;
  profiles: {
    display_name: string | null;
    avatar_url: string | null;
    username: string | null;
    position: string | null;
  } | null;
}

interface ProjectPageClientProps {
  projectId: string;
}

export default function ProjectPageClient({ projectId }: ProjectPageClientProps) {
  const router = useRouter();

  const [project, setProject] = useState<any>(null);
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    if (projectId) {
      loadProjectData();
    }
  }, [projectId]);

  const loadProjectData = async () => {
    try {
      setLoading(true);

      // Загружаем проект
      const { data: projectData, error: projectError } = await supabase
        .from("projects")
        .select("*")
        .eq("id", projectId)
        .single();

      if (projectError) throw projectError;
      setProject(projectData);

      // Загружаем участников проекта
      const { data: membersData, error: membersError } = await supabase
        .from("project_members")
        .select("user_id, profiles(display_name, avatar_url, username, position)")
        .eq("project_id", projectId);

      if (membersError) throw membersError;
      setMembers((membersData || []) as ProjectMember[]);

      // Загружаем задачи проекта
      await loadTasks();
    } catch (error) {
      console.error("Error loading project data:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadTasks = async () => {
    try {
      let tasksQuery = supabase
        .from("tasks")
        .select("*, projects(title)")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false });

      // Фильтруем по выбранному участнику, если выбран
      if (selectedMemberId) {
        tasksQuery = tasksQuery.eq("assignee_id", selectedMemberId);
      }

      const { data: tasksData, error: tasksError } = await tasksQuery;

      if (tasksError) throw tasksError;

      const formattedTasks: Task[] = (tasksData || []).map((task: any) => ({
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
      }));

      setTasks(formattedTasks);
    } catch (error) {
      console.error("Error loading tasks:", error);
    }
  };

  useEffect(() => {
    if (projectId) {
      loadTasks();
    }
  }, [projectId, selectedMemberId]);

  const formatTimeTracking = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}`;
  };

  const handleStatusChange = async (taskId: string, newStatus: TaskStatus) => {
    try {
      setUpdating(taskId);
      haptics.light();

      const { error } = await supabase
        .from("tasks")
        .update({ status: newStatus })
        .eq("id", taskId);

      if (error) throw error;

      setTasks((prevTasks) =>
        prevTasks.map((task) =>
          task.id === taskId ? { ...task, status: newStatus, completed: newStatus === "done" } : task
        )
      );
    } catch (error) {
      console.error("Error updating task status:", error);
    } finally {
      setUpdating(null);
    }
  };

  const handleTimeTrackingToggle = async (taskId: string) => {
    haptics.light();

    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    const newIsTracking = !task.isTracking;

    try {
      const { error } = await supabase
        .from("tasks")
        .update({ is_tracking: newIsTracking })
        .eq("id", taskId);

      if (error) throw error;

      setTasks((prevTasks) =>
        prevTasks.map((task) =>
          task.id === taskId ? { ...task, isTracking: newIsTracking } : task
        )
      );
    } catch (error) {
      console.error("Error updating time tracking:", error);
    }
  };

  const handleMemberClick = (memberId: string) => {
    haptics.light();
    if (selectedMemberId === memberId) {
      // Снимаем фильтр, если кликнули на уже выбранного участника
      setSelectedMemberId(null);
    } else {
      setSelectedMemberId(memberId);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--tg-theme-bg-color)] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[var(--tg-theme-button-color)] animate-spin" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-[var(--tg-theme-bg-color)] flex items-center justify-center">
        <div className="text-[var(--tg-theme-text-color)]">Проект не найден</div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.4,
        ease: [0.19, 1, 0.22, 1],
      }}
      className="min-h-screen bg-[var(--tg-theme-bg-color)]"
    >
      {/* Top Navigation */}
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
      </div>

      <main
        className="container mx-auto px-4 pb-24"
        style={{
          paddingBottom: "calc(6rem + env(safe-area-inset-bottom))",
        }}
      >
        {/* Project Title */}
        <h1 className="text-2xl font-bold text-[var(--tg-theme-text-color)] mb-6">
          {project.title}
        </h1>

        {/* Members Section */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-[var(--tg-theme-hint-color)]">
              Всего участников: {members.length}
            </p>
          </div>

          {/* Avatar Group */}
          <div className="flex items-center gap-2 flex-wrap">
            {members.map((member) => {
              const profile = member.profiles;
              const displayName = profile?.display_name || profile?.username || "User";
              const avatarUrl = profile?.avatar_url;
              const isSelected = selectedMemberId === member.user_id;

              return (
                <motion.button
                  key={member.user_id}
                  onClick={() => handleMemberClick(member.user_id)}
                  className={cn(
                    "relative flex-shrink-0 transition-all",
                    isSelected && "ring-2 ring-[var(--tg-theme-button-color)] ring-offset-2 ring-offset-[var(--tg-theme-bg-color)] rounded-full"
                  )}
                  whileTap={{ scale: 0.9 }}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{
                    duration: 0.2,
                    ease: [0.19, 1, 0.22, 1],
                  }}
                >
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt={displayName}
                      className="w-10 h-10 rounded-full border-2 border-[var(--tg-theme-bg-color)]"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-[var(--tg-theme-button-color)] flex items-center justify-center border-2 border-[var(--tg-theme-bg-color)]">
                      <span className="text-xs font-medium text-white">
                        {displayName[0].toUpperCase()}
                      </span>
                    </div>
                  )}
                  {isSelected && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-1 -right-1 w-4 h-4 bg-[var(--tg-theme-button-color)] rounded-full border-2 border-[var(--tg-theme-bg-color)]"
                    />
                  )}
                </motion.button>
              );
            })}
          </div>

          {/* Filter indicator */}
          {selectedMemberId && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-3 text-xs text-[var(--tg-theme-hint-color)]"
            >
              Показаны задачи только выбранного участника
            </motion.div>
          )}
        </div>

        {/* Tasks List */}
        <div>
          <h2 className="text-lg font-semibold text-[var(--tg-theme-text-color)] mb-4">
            Задачи
          </h2>

          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <motion.div
                  variants={animationVariants.staggerContainer}
                  initial="initial"
                  animate="animate"
                >
                  {[1, 2, 3].map((i) => (
                    <TaskCardSkeleton key={i} />
                  ))}
                </motion.div>
              </motion.div>
            ) : (
              <motion.div
                key="content"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <motion.div
                  variants={animationVariants.staggerContainer}
                  initial="initial"
                  animate="animate"
                >
                  {tasks.length > 0 ? (
                    tasks.map((task) => (
                      <AnimatePresence key={task.id} mode="wait">
                        {updating === task.id ? (
                          <motion.div
                            key={`loading-${task.id}`}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-[var(--tg-theme-secondary-bg-color)] rounded-xl p-4 mb-3 flex items-center justify-center"
                          >
                            <Loader2 className="w-5 h-5 text-[var(--tg-theme-button-color)] animate-spin" />
                          </motion.div>
                        ) : (
                          <TaskCard
                            key={`task-${task.id}`}
                            task={task}
                            onStatusChange={handleStatusChange}
                            onTimeTrackingToggle={handleTimeTrackingToggle}
                          />
                        )}
                      </AnimatePresence>
                    ))
                  ) : (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-[var(--tg-theme-secondary-bg-color)] rounded-xl p-8 text-center"
                    >
                      <p className="text-sm text-[var(--tg-theme-hint-color)]">
                        {selectedMemberId
                          ? "У этого участника пока нет задач"
                          : "В проекте пока нет задач"}
                      </p>
                    </motion.div>
                  )}
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      <BottomNavigation />
    </motion.div>
  );
}
