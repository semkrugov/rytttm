"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import AppHeader from "@/components/AppHeader";
import BottomNavigation from "@/components/BottomNavigation";
import AttentionCards from "@/components/AttentionCards";
import FocusTasks from "@/components/FocusTasks";
import ProjectsList from "@/components/ProjectsList";
import { Task, Project } from "@/types";
import { mockNotifications } from "@/lib/mockData";
import { supabase } from "@/lib/supabase";
import { animationVariants } from "@/lib/animations";
import { useTelegramAuth } from "@/hooks/useTelegramAuth";
import { cn } from "@/lib/utils";
import { useHasAnimated } from "@/hooks/useHasAnimated";

type TaskViewMode = "my" | "all";

// Демо-данные вынесены наружу для надежной инициализации
const demoNotifications = [
  {
    title: "Новая задача",
    message: "ИИ нашёл новую задачу «Сверстать демо-экран» в чате Рабочий чат.",
    time: "5 минут назад",
  },
  {
    title: "Завершён проект",
    message: "Ваня завершил проект «Рабочий чат».",
    time: "30 минут назад",
  },
  {
    title: "Скорый дедлайн",
    message: "Дедлайн по дизайну через 2 часа.",
    time: "1 час назад",
  },
  {
    title: "Новый комментарий",
    message: "В чате «Личные дела» появился новый комментарий.",
    time: "2 часа назад",
  },
  {
    title: "Напоминание",
    message: "Не забудь покормить кота и дописать документацию.",
    time: "Вчера",
  },
];

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

const demoProjects: Project[] = [
  {
    id: "demo-work",
    title: "Рабочий чат",
    active: true,
    unreadCount: 3,
  },
  {
    id: "demo-life",
    title: "Личные дела",
    active: true,
    unreadCount: 1,
  },
];

export default function Home() {
  const router = useRouter();
  const { user, loading: authLoading } = useTelegramAuth();
  const hasAnimated = useHasAnimated();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTasksCount, setActiveTasksCount] = useState(0);
  const [projectsCount, setProjectsCount] = useState(0);
  const [taskViewMode, setTaskViewMode] = useState<TaskViewMode>("my");
  const [isAttentionExpanded, setIsAttentionExpanded] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const channelRef = useRef<any>(null);

  const isDemoMode = !authLoading && !user;

  // Инициализация данных
  useEffect(() => {
    if (authLoading) return;

    if (user) {
      loadData();
      setNotifications([]);

      const fetchRecentNotifications = async () => {
        try {
          const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
          const { data } = await supabase
            .from("tasks")
            .select("id, title, created_at, assignee_id")
            .gte("created_at", since)
            .or(`assignee_id.eq.${user.id},assignee_id.is.null`)
            .order("created_at", { ascending: false })
            .limit(20);

          if (!data?.length) return;

          const formatTime = (d: string) => {
            const min = Math.floor((Date.now() - new Date(d).getTime()) / 60000);
            if (min < 1) return "Только что";
            if (min < 60) return `${min} мин. назад`;
            const h = Math.floor(min / 60);
            if (h < 24) return `${h} ч. назад`;
            const day = Math.floor(h / 24);
            return day === 1 ? "Вчера" : `${day} дн. назад`;
          };

          const list = data.map((t: any) => ({
            id: t.id,
            title: "Новая задача",
            message: `ИИ нашёл новую задачу «${t.title}».`,
            time: formatTime(t.created_at),
          }));

          setNotifications((prev) => {
            const seen = new Set(prev.map((n) => n.id));
            const added = list.filter((n) => !seen.has(n.id));
            return added.length ? [...added, ...prev] : prev;
          });
        } catch (e) {
          console.error("fetchRecentNotifications:", e);
        }
      };

      fetchRecentNotifications();
    } else {
      // Инициализируем демо-данными сразу, если нет пользователя
      setTasks(demoTasks);
      setProjects(demoProjects);
      setNotifications(demoNotifications);
      setLoading(false);
    }
  }, [authLoading, user]);

  // Realtime подписка на изменения задач
  useEffect(() => {
    if (!user) return;

    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    const channel = supabase
      .channel("public:tasks")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "tasks",
        },
        async (payload) => {
          console.log("Realtime событие:", payload);
          
          if (payload.eventType === "INSERT") {
            const task = payload.new as any;

            const isForMe = task.assignee_id === user.id || !task.assignee_id;
            if (!isForMe) return;

            const newNotif = {
              id: task.id,
              title: "Новая задача",
              message: `ИИ нашёл новую задачу «${task.title}».`,
              time: "Только что",
            };

            setNotifications((prev) => {
              if (prev.some((n) => n.id === task.id)) return prev;
              return [newNotif, ...prev];
            });

            if (task.assignee_id === user.id) {
              loadData(true);
            }
          } else {
            // Для остальных событий (UPDATE, DELETE) просто обновляем список
            if (taskViewMode === "all") {
              loadData(true);
            } else {
              const task = (payload.new || payload.old) as any;
              if (task.assignee_id === user.id) {
                loadData(true);
              }
            }
          }
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [user, taskViewMode]);

  const loadData = async (silent = false) => {
    try {
      if (!silent) setLoading(true);

      let tasksQuery = supabase
        .from("tasks")
        .select("*, projects(title), assignee:profiles!assignee_id(username, avatar_url)")
        .neq("status", "done")
        .order("created_at", { ascending: false })
        .limit(3);

      if (taskViewMode === "my" && user?.id) {
        tasksQuery = tasksQuery.eq("assignee_id", user.id);
      }

      const { data: tasksData, error: tasksError } = await tasksQuery;
      if (tasksError) throw tasksError;

      let countQuery = supabase
        .from("tasks")
        .select("*", { count: "exact", head: true });

      if (taskViewMode === "my" && user?.id) {
        countQuery = countQuery.eq("assignee_id", user.id);
      }

      const { count: activeCount } = await countQuery;

      let projectsData: any[] = [];
      let projectsCountData: number | null = 0;

      if (user?.id) {
        const projectsQuery = supabase
          .from("projects")
          .select("*, project_members!inner(user_id)")
          .eq("project_members.user_id", user.id)
          .order("created_at", { ascending: false });

        const { data, error: projectsError } = await projectsQuery;
        if (projectsError) throw projectsError;
        projectsData = data || [];

        const { count } = await supabase
          .from("projects")
          .select("*, project_members!inner(user_id)", { count: "exact", head: true })
          .eq("project_members.user_id", user.id);
        
        projectsCountData = count;
      }

      const formattedTasks: Task[] = (tasksData || []).map((task: any) => ({
        id: task.id,
        title: task.title,
        project: task.project_id,
        projectTitle: task.projects?.title || "Без проекта",
        deadline: task.deadline
          ? new Date(task.deadline).toLocaleDateString("ru-RU")
          : undefined,
        status: (task.status as "todo" | "doing" | "done") || "todo",
        completed: task.status === "done",
        assignee: task.assignee || null,
      }));

      const formattedProjects: Project[] = (projectsData || []).map(
        (project: any) => ({
          id: project.id,
          title: project.title,
          active: true,
          unreadCount: 0,
        })
      );

      setTasks(formattedTasks);
      setProjects(formattedProjects);
      setActiveTasksCount(activeCount || 0);
      setProjectsCount(projectsCountData || 0);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleTaskToggle = async (taskId: string, completed: boolean) => {
    // 1. Сначала мгновенно обновляем состояние чекбокса в UI
    setTasks((prevTasks) =>
      prevTasks.map((task) =>
        task.id === taskId ? { ...task, completed } : task
      )
    );

    if (isDemoMode) {
      if (completed) {
        // В демо-режиме просто ждем 500мс и удаляем
        setTimeout(() => {
          setTasks((prevTasks) => prevTasks.filter((task) => task.id !== taskId));
        }, 500);
      }
      return;
    }

    try {
      const newStatus = completed ? "done" : "todo";
      
      if (completed) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      const { error } = await supabase
        .from("tasks")
        .update({ status: newStatus })
        .eq("id", taskId);

      if (error) throw error;

      if (completed) {
        setTasks((prevTasks) => prevTasks.filter((task) => task.id !== taskId));
        loadData(true);
      } else {
        setTasks((prevTasks) =>
          prevTasks.map((task) =>
            task.id === taskId ? { ...task, completed, status: newStatus } : task
          )
        );
      }

      const { count } = await supabase
        .from("tasks")
        .select("*", { count: "exact", head: true })
        .in("status", ["todo", "doing"]);
      setActiveTasksCount(count || 0);
    } catch (error) {
      console.error("Error updating task:", error);
      loadData(true);
    }
  };

  const handleTaskClick = (taskId: string) => {
    router.push(`/tasks/${taskId}`);
  };

  const handleProjectClick = (projectId: string) => {
    router.push(`/projects/${projectId}`);
  };

  const activeNotifications = isDemoMode 
    ? (notifications.length > 0 ? notifications : demoNotifications)
    : notifications;
  const visibleTasks = tasks;
  const visibleProjects = projects;

  return (
    <div className="min-h-screen bg-[rgba(35,36,39,1)]">
      <main
        className="mx-auto max-w-[390px] py-4 pb-24"
        style={{
          paddingBottom: "calc(6rem + env(safe-area-inset-bottom))",
        }}
      >
        <AnimatePresence mode="wait">
          {(authLoading || (loading && !isDemoMode)) ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              <div className="h-6 bg-[#28292D] rounded animate-pulse w-1/3 mx-[18px]" />
              <div className="h-32 bg-[#1E1F22] rounded-[14px] animate-pulse mx-[18px]" />
              <div className="h-32 bg-[#1E1F22] rounded-[14px] animate-pulse mx-[18px]" />
            </motion.div>
          ) : (
            <motion.div
              key="content"
              initial={hasAnimated ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={
                hasAnimated ? { duration: 0 } : { duration: 0.3, ease: [0.19, 1, 0.22, 1] }
              }
            >
              <div className="flex flex-col gap-[18px]">
                {isDemoMode && (
                  <div
                    className="mx-[18px] mb-1 rounded-[10px] px-3 py-2 bg-[#1E1F22]/80 text-[11px] text-[#9097A7]"
                  >
                    Работает демо-режим. Зайдите через Telegram, чтобы увидеть свои реальные задачи.
                  </div>
                )}
                <AppHeader />

                {activeNotifications.length > 0 && (
                  <AttentionCards
                    notifications={activeNotifications.map((n) => ({
                      id: "id" in n ? n.id : undefined,
                      title: n.title,
                      message: n.message,
                      time: n.time,
                    }))}
                    isExpanded={isAttentionExpanded}
                    onToggleExpand={() => {
                      setIsAttentionExpanded((prev) => !prev);
                    }}
                    onAcceptAll={() => setNotifications([])}
                    hasAnimated={hasAnimated}
                  />
                )}

                <section className="space-y-3 px-[18px]">
                  <div className="flex items-center justify-between">
                    <h2 className="text-[22px] font-medium text-white">
                      Мой фокус
                    </h2>
                    <button
                      type="button"
                      onClick={() => router.push("/tasks")}
                      className="text-[16px] font-normal text-[#6CC2FF]"
                    >
                      Все задачи
                    </button>
                  </div>

                  <div className="rounded-[14px] bg-gradient-to-br from-[#232427] to-[#18191B] overflow-hidden">
                    {visibleTasks.length > 0 ? (
                      <FocusTasks
                        tasks={visibleTasks}
                        onTaskToggle={handleTaskToggle}
                        onTaskClick={handleTaskClick}
                        hideHeader
                        className="mb-0"
                      />
                    ) : (
                      <div className="text-center py-6 px-4">
                        <p className="text-sm text-[#9097A7]">
                          Для тебя пока нет задач. Отдохни или проверь общий список.
                        </p>
                      </div>
                    )}
                  </div>
                </section>

                <section className="space-y-3 px-[18px]">
                  <div className="flex items-center justify-between">
                    <h2 className="text-[22px] font-medium text-white">
                      Проекты
                    </h2>
                    <button
                      type="button"
                      onClick={() => router.push("/projects")}
                      className="text-[16px] font-normal text-[#6CC2FF]"
                    >
                      Все проекты
                    </button>
                  </div>

                  <div className="rounded-[14px] bg-gradient-to-br from-[#232427] to-[#18191B] overflow-hidden">
                    <ProjectsList
                      projects={visibleProjects}
                      onProjectClick={handleProjectClick}
                      hideHeader
                      className="mb-0"
                    />
                  </div>
                </section>

                <div className="mt-2 mx-[18px] py-2 rounded-lg bg-[#1E1F22]/80 text-center">
                  <p className="text-xs text-[#9097A7]">
                    {user?.username ? `@${user.username}` : "Вход не выполнен"}
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <BottomNavigation />
    </div>
  );
}
