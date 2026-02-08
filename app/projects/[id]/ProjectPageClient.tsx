"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Loader2,
  MessageCircle,
  UserPlus,
  Plus,
  Calendar,
} from "lucide-react";
import AppHeader from "@/components/AppHeader";
import BottomNavigation from "@/components/BottomNavigation";
import { Task, TaskStatus } from "@/types";
import { supabase } from "@/lib/supabase";
import { animationVariants } from "@/lib/animations";
import { haptics } from "@/lib/telegram";
import { cn } from "@/lib/utils";
import { useTelegramAuth } from "@/hooks/useTelegramAuth";
import { useHasAnimated } from "@/hooks/useHasAnimated";

interface ProjectMember {
  user_id: string;
  profiles: {
    avatar_url: string | null;
    username: string | null;
    position: string | null;
  } | null;
}

interface ProjectPageClientProps {
  projectId: string;
}

const DEMO_PROJECTS: Record<string, { id: string; title: string }> = {
  "demo-work": { id: "demo-work", title: "Рабочий чат" },
  "demo-life": { id: "demo-life", title: "Личные дела" },
};

const DEMO_MEMBERS: ProjectMember[] = [
  {
    user_id: "demo-anna",
    profiles: {
      avatar_url: null,
      username: "Anna_designer",
      position: null,
    },
  },
];

const DEMO_TASKS: Task[] = [
  {
    id: "demo-1",
    title: "Сверстать демо-экран",
    project: "demo-work",
    projectTitle: "Рабочий чат",
    deadline: undefined,
    deadlineTime: "12:00 | 25.02",
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
    deadlineTime: "14:30 | 26.02",
    status: "todo",
    completed: false,
    assignee: null,
  },
  {
    id: "demo-3",
    title: "Отладка БД на проде",
    project: "demo-work",
    projectTitle: "Рабочий чат",
    deadline: undefined,
    deadlineTime: "09:00 | 24.02",
    status: "todo",
    completed: false,
    assignee: null,
  },
];

function formatDeadlineRu(deadline: string | null): string {
  if (!deadline) return "";
  const d = new Date(deadline);
  const time = d.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
  const date = d.toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit" });
  return `${time} | ${date}`;
}

function formatTimeTracking(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
}

export default function ProjectPageClient({ projectId }: ProjectPageClientProps) {
  const router = useRouter();
  const { user } = useTelegramAuth();
  const hasAnimated = useHasAnimated();

  const [project, setProject] = useState<{ id: string; title: string } | null>(null);
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [tasks, setTasks] = useState<(Task & { isOverdue?: boolean })[]>([]);
  const [loading, setLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);

  useEffect(() => {
    if (!projectId) return;

    if (projectId.startsWith("demo-") && DEMO_PROJECTS[projectId]) {
      setProject(DEMO_PROJECTS[projectId]);
      setMembers(DEMO_MEMBERS);
      setTasks(DEMO_TASKS.filter((t) => t.project === projectId));
      setLoading(false);
      setAccessDenied(false);
      return;
    }

    if (user?.id) {
      loadProjectData();
    } else {
      setLoading(true);
    }
  }, [projectId, user?.id]);

  const loadProjectData = async () => {
    try {
      setLoading(true);
      setAccessDenied(false);
      if (!user?.id) {
        setAccessDenied(true);
        setLoading(false);
        return;
      }

      const { data: membershipData, error: membershipError } = await supabase
        .from("project_members")
        .select("user_id")
        .eq("project_id", projectId)
        .eq("user_id", user.id)
        .maybeSingle();

      if (membershipError && membershipError.code !== "PGRST116") {
        console.error("Error checking membership:", membershipError);
      }
      if (!membershipData) {
        setAccessDenied(true);
        setLoading(false);
        return;
      }

      const { data: projectData, error: projectError } = await supabase
        .from("projects")
        .select("*")
        .eq("id", projectId)
        .single();
      if (projectError) throw projectError;
      setProject(projectData ? { id: projectData.id, title: projectData.title } : null);

      const { data: membersData, error: membersError } = await supabase
        .from("project_members")
        .select("*, profiles(username, avatar_url, position)")
        .eq("project_id", projectId);
      if (membersError) throw membersError;
      setMembers((membersData as ProjectMember[]) || []);

      await loadTasks();
    } catch (error) {
      console.error("Error loading project data:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadTasks = async () => {
    try {
      const { data: tasksData, error: tasksError } = await supabase
        .from("tasks")
        .select("*, projects(title), assignee:profiles!assignee_id(username, avatar_url)")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false });

      if (tasksError) throw tasksError;

      const formattedTasks: (Task & { isOverdue?: boolean })[] = (tasksData || []).map(
        (task: any) => {
          const deadline = task.deadline ? new Date(task.deadline) : null;
          const isOverdue = deadline ? deadline < new Date() : false;
          return {
            id: task.id,
            title: task.title,
            project: task.project_id,
            projectTitle: task.projects?.title || "Без проекта",
            deadline:
              task.deadline && deadline ? deadline.toLocaleDateString("ru-RU") : undefined,
            deadlineTime: task.deadline ? formatDeadlineRu(task.deadline) : undefined,
            status: (task.status as TaskStatus) || "todo",
            timeTracking: task.time_tracking ? formatTimeTracking(task.time_tracking) : undefined,
            isTracking: task.is_tracking || false,
            completed: task.status === "done",
            assignee: task.assignee || null,
            isOverdue,
          };
        }
      );
      setTasks(formattedTasks);
    } catch (error) {
      console.error("Error loading tasks:", error);
    }
  };

  useEffect(() => {
    if (!projectId || projectId.startsWith("demo-")) return;
    loadTasks();
  }, [projectId]);

  const handleAddParticipant = () => {
    haptics.light();
    // TODO: открыть модал/экран добавления участника
  };

  const handleAddTask = () => {
    haptics.light();
    router.push(`/projects/${projectId}/add-task`);
  };

  const handleOpenChat = () => {
    haptics.light();
    // TODO: открыть чат проекта
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[rgba(35,36,39,1)] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#6CC2FF] animate-spin" />
      </div>
    );
  }

  if (accessDenied) {
    return (
      <div className="min-h-screen bg-[rgba(35,36,39,1)]">
        <AppHeader
          leftSlot={
            <button
              onClick={() => router.push("/")}
              className="w-10 h-10 rounded-full bg-[#1E1F22] flex items-center justify-center"
            >
              <ArrowLeft className="w-5 h-5 text-white" strokeWidth={2} />
            </button>
          }
        />
        <div className="flex items-center justify-center min-h-[60vh] px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: [0.19, 1, 0.22, 1] }}
            className="rounded-[14px] bg-[#1E1F22] p-8 text-center max-w-md"
          >
            <h2 className="text-lg font-semibold text-white mb-2">Доступ запрещен</h2>
            <p className="text-sm text-[#9097A7] mb-6">
              У тебя нет доступа к этому проекту.
            </p>
            <button
              onClick={() => router.push("/")}
              className="px-6 py-2.5 rounded-full text-sm font-medium text-white"
              style={{ background: "linear-gradient(90deg, #C3CBFF 0%, #F6B3FF 100%)" }}
            >
              Вернуться на главную
            </button>
          </motion.div>
        </div>
        <BottomNavigation />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-[rgba(35,36,39,1)] flex items-center justify-center">
        <div className="text-white">Проект не найден</div>
      </div>
    );
  }

  const projectLetter = (project.title || "?").charAt(0).toUpperCase();

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
            className="w-10 h-10 rounded-full bg-[#1E1F22] flex items-center justify-center"
          >
            <ArrowLeft className="w-5 h-5 text-white" strokeWidth={2} />
          </button>
        }
      />

      <main
        className="mx-auto max-w-[390px] px-[18px] pb-24"
        style={{ paddingBottom: "calc(6rem + env(safe-area-inset-bottom))" }}
      >
        {/* Карточка проекта */}
        <div className="rounded-[14px] bg-[#1E1F22] overflow-hidden mb-6">
          <div className="flex items-center gap-3 px-4 py-4">
            <div className="w-12 h-12 rounded-full bg-[#3B82F6] flex items-center justify-center text-white text-xl font-medium flex-shrink-0">
              {projectLetter}
            </div>
            <span className="flex-1 text-white font-medium truncate min-w-0">
              {project.title}
            </span>
            <button
              type="button"
              onClick={handleOpenChat}
              className="w-10 h-10 rounded-full bg-[#28292D] flex items-center justify-center flex-shrink-0"
            >
              <MessageCircle className="w-5 h-5 text-white" strokeWidth={2} />
            </button>
          </div>
        </div>

        {/* Участники */}
        <div className="mb-6">
          <h2 className="text-white font-medium mb-3">Участники</h2>
          <div className="rounded-[14px] bg-[#1E1F22] overflow-hidden">
            <div className="divide-y divide-[#28292D]">
              {members.map((member) => {
                const profile = Array.isArray(member.profiles)
                  ? member.profiles[0]
                  : member.profiles;
                const name = profile?.username ?? "Участник";
                const avatarUrl = profile?.avatar_url;
                return (
                  <div
                    key={member.user_id}
                    className="flex items-center gap-3 px-4 py-3"
                  >
                    {avatarUrl ? (
                      <img
                        src={avatarUrl}
                        alt=""
                        className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-[#3B82F6] flex items-center justify-center text-white text-sm font-medium flex-shrink-0">
                        {name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <span className="text-white font-medium truncate">{name}</span>
                  </div>
                );
              })}
              <button
                type="button"
                onClick={handleAddParticipant}
                className="flex items-center gap-3 px-4 py-3 w-full text-left"
              >
                <div className="w-10 h-10 rounded-full bg-[#3B82F6]/20 flex items-center justify-center flex-shrink-0">
                  <UserPlus className="w-5 h-5 text-[#3B82F6]" strokeWidth={2} />
                </div>
                <span className="text-[#3B82F6] font-medium">Добавить участника</span>
              </button>
            </div>
          </div>
        </div>

        {/* Задачи */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-white font-medium">Задачи</h2>
<Link
                href={`/projects/${projectId}/tasks`}
                className="flex items-center gap-2 text-[#3B82F6]"
                onClick={() => haptics.light()}
              >
                <span className="font-medium text-[#3B82F6]">Все задачи</span>
              </Link>
          </div>

          <AnimatePresence mode="wait">
            {tasks.length === 0 ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="rounded-[14px] bg-[#1E1F22] p-8 text-center"
              >
                <p className="text-sm text-[#9097A7]">В проекте пока нет задач</p>
              </motion.div>
            ) : (
              <motion.div
                key="list"
                variants={hasAnimated ? undefined : animationVariants.staggerContainer}
                initial={hasAnimated ? false : "initial"}
                animate={hasAnimated ? false : "animate"}
                className="space-y-2"
              >
                {tasks.map((task, index) => (
                  <motion.div
                    key={task.id}
                    variants={hasAnimated ? undefined : animationVariants.staggerItem}
                  >
                    <Link href={`/tasks/${task.id}`}>
                      <div
                        className={cn(
                          "rounded-[14px] bg-[#1E1F22] overflow-hidden px-4 py-3",
                          "active:opacity-90 transition-opacity"
                        )}
                      >
                        <div
                          className={cn(
                            "flex items-center gap-2 text-sm mb-1",
                            task.isOverdue ? "text-[#F97316]" : "text-[#C3CBFF]"
                          )}
                        >
                          <Calendar
                            className="w-4 h-4 flex-shrink-0"
                            strokeWidth={2}
                          />
                          <span>{task.deadlineTime || "Без срока"}</span>
                        </div>
                        <p className="text-white font-medium truncate">{task.title}</p>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          <button
            type="button"
            onClick={handleAddTask}
            className="mt-3 flex items-center justify-center gap-2 w-full py-3 rounded-[14px] bg-[#1E1F22] text-[#3B82F6]"
          >
            <span className="w-8 h-8 rounded-full bg-[#3B82F6]/20 flex items-center justify-center">
              <Plus className="w-4 h-4 text-[#3B82F6]" strokeWidth={2.5} />
            </span>
            <span className="font-medium text-[#3B82F6]">Добавить</span>
          </button>
        </div>
      </main>

      <BottomNavigation />
    </motion.div>
  );
}
