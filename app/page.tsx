"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Bell, ChevronDown } from "lucide-react";
import BottomNavigation from "@/components/BottomNavigation";
import NotificationCard from "@/components/NotificationCard";
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
  const channelRef = useRef<any>(null);

  // Отладка статуса пользователя
  useEffect(() => {
    console.log("User status:", user);
  }, [user]);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user, taskViewMode]);

  // Realtime подписка на изменения задач
  useEffect(() => {
    if (!user) return;

    // Отключаем предыдущую подписку, если есть
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    // Создаем новую подписку
    const channel = supabase
      .channel("public:tasks")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "tasks",
        },
        (payload) => {
          console.log("Realtime событие:", payload);
          // Фильтруем на фронтенде, если показываем "Мои задачи"
          if (taskViewMode === "my" && user.id) {
            const task = payload.new as any;
            if (task.assignee_id === user.id) {
              loadData();
            }
          } else {
            loadData();
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

  const loadData = async () => {
    try {
      setLoading(true);

      // Загружаем задачи с информацией о проектах и исполнителе (топ-3 для "Мой Фокус")
      // Используем join для получения названия проекта и профиля исполнителя
      let tasksQuery = supabase
        .from("tasks")
        .select("*, projects(title), assignee:profiles!assignee_id(username, avatar_url)")
        .order("created_at", { ascending: false })
        .limit(3);

      // Фильтруем по assignee_id, если показываем "Мои задачи"
      if (taskViewMode === "my" && user?.id) {
        tasksQuery = tasksQuery.eq("assignee_id", user.id);
      }

      const { data: tasksData, error: tasksError } = await tasksQuery;

      if (tasksError) throw tasksError;

      console.log("Загруженные задачи на главной:", tasksData);

      // Загружаем все задачи для подсчета (с учетом фильтра)
      let countQuery = supabase
        .from("tasks")
        .select("*", { count: "exact", head: true });

      if (taskViewMode === "my" && user?.id) {
        countQuery = countQuery.eq("assignee_id", user.id);
      }

      const { count: activeCount } = await countQuery;

      // Загружаем проекты, где текущий пользователь состоит в project_members
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

        // Загружаем количество проектов, где пользователь состоит
        const { count } = await supabase
          .from("projects")
          .select("*, project_members!inner(user_id)", { count: "exact", head: true })
          .eq("project_members.user_id", user.id);
        
        projectsCountData = count;
      }

      // Преобразуем задачи
      // В базе нет поля status, поэтому используем дефолтное значение "todo"
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

      // Преобразуем проекты
      // В базе нет поля status, поэтому считаем все проекты активными
      const formattedProjects: Project[] = (projectsData || []).map(
        (project: any) => ({
          id: project.id,
          title: project.title,
          active: true, // Все проекты считаем активными
          unreadCount: 0, // TODO: Подсчитать из задач
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
    try {
      const newStatus = completed ? "done" : "todo";
      const { error } = await supabase
        .from("tasks")
        .update({ status: newStatus })
        .eq("id", taskId);

      if (error) throw error;

      setTasks((prevTasks) =>
        prevTasks.map((task) =>
          task.id === taskId ? { ...task, completed, status: newStatus } : task
        )
      );

      // Обновляем счетчик
      const { count } = await supabase
        .from("tasks")
        .select("*", { count: "exact", head: true })
        .in("status", ["todo", "doing"]);
      setActiveTasksCount(count || 0);
    } catch (error) {
      console.error("Error updating task:", error);
    }
  };

  const handleProjectClick = (projectId: string) => {
    router.push(`/projects/${projectId}`);
  };

  // Показываем загрузчик во время авторизации
  if (authLoading) {
    return (
      <div className="min-h-screen bg-[var(--tg-theme-bg-color)] flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{
            duration: 0.3,
            ease: [0.19, 1, 0.22, 1],
          }}
          className="flex flex-col items-center gap-3"
        >
          <Loader2 className="w-8 h-8 text-[var(--tg-theme-button-color)] animate-spin" />
          <p className="text-sm text-[var(--tg-theme-hint-color)]">
            Загрузка...
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--tg-theme-bg-color)]">
      <main
        className="mx-auto max-w-[390px] px-4 py-4 pb-24"
        style={{
          paddingBottom: "calc(6rem + env(safe-area-inset-bottom))",
        }}
      >
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{
                duration: 0.3,
                ease: [0.19, 1, 0.22, 1],
              }}
              className="space-y-6"
            >
              <div className="h-6 bg-[var(--tg-theme-hint-color)]/20 rounded animate-pulse w-1/3" />
              <div className="h-32 bg-[var(--tg-theme-secondary-bg-color)] rounded-xl animate-pulse" />
              <div className="h-32 bg-[var(--tg-theme-secondary-bg-color)] rounded-xl animate-pulse" />
            </motion.div>
          ) : (
            <motion.div
              key="content"
              initial={hasAnimated ? false : { opacity: 0, y: 20 }}
              animate={hasAnimated ? { opacity: 1, y: 0 } : { opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={
                hasAnimated
                  ? { duration: 0 }
                  : {
                      duration: 0.4,
                      ease: [0.19, 1, 0.22, 1],
                    }
              }
            >
              <div className="flex flex-col gap-3">
                {/* Хедер как в макете "header" */}
                <div className="h-[60px] flex items-center gap-2">
                  {/* left iconFrame 40x40 с отступом 10 */}
                  <div className="w-10 h-10 rounded-full bg-[var(--tg-theme-secondary-bg-color)]/80 ml-[10px]" />

                  {/* logoFrame 270x40, логотип строго по центру */}
                  <div className="flex-1 flex items-center justify-center">
                    <div className="h-[27px] flex items-center gap-3">
                      {/* Градиентный знак логотипа */}
                      <div
                        className="w-[62px] h-[18px] rounded-sm"
                        style={{
                          backgroundImage:
                            "linear-gradient(90deg, #C3CBFF 0%, #F6B3FF 100%)",
                        }}
                      />
                      {/* Разделитель как белая полоска */}
                      <div className="w-[2px] h-[23px] bg-white/90 rounded-full" />
                      {/* Надпись beta */}
                      <span className="text-[13px] leading-none text-white">
                        beta
                      </span>
                    </div>
                  </div>

                  {/* right iconFrame 40x40 с отступом 10 справа */}
                  <div className="w-10 h-10 rounded-full bg-[var(--tg-theme-secondary-bg-color)]/80 mr-[10px]" />
                </div>

                {/* Блок уведомлений / Attention:
                    - 1–2 уведомления: обычная карточка
                    - >2: компактная карточка + возможность раскрыть список */}
                {mockNotifications.length > 0 && (
                  <motion.div
                    initial={hasAnimated ? false : { opacity: 0, y: 20 }}
                    animate={
                      hasAnimated ? { opacity: 1, y: 0 } : { opacity: 1, y: 0 }
                    }
                    transition={
                      hasAnimated
                        ? { duration: 0 }
                        : {
                            duration: 0.3,
                            ease: [0.19, 1, 0.22, 1],
                          }
                    }
                    className="mx-[18px] rounded-[14px] p-[16px] bg-gradient-to-br from-[#232427] via-[#18191c] to-[#101113]"
                  >
                    <button
                      type="button"
                      className="w-full text-left"
                      onClick={() => {
                        if (mockNotifications.length > 2) {
                          setIsAttentionExpanded((prev) => !prev);
                        }
                      }}
                    >
                      {/* Верхняя часть карточки — как в базовом состоянии */}
                      <div className="flex items-start gap-3">
                        {/* Icon */}
                        <div className="flex-shrink-0 w-[27px] h-[29px] flex items-center justify-center">
                          <div className="w-6 h-6 rounded-full bg-transparent flex items-center justify-center">
                            <Bell className="w-[22px] h-[22px] text-[#9098A7]" />
                          </div>
                        </div>

                        {/* TextContent */}
                        <div className="flex-1 min-w-0 space-y-2">
                          {/* Header */}
                          <div className="flex items-center justify-between">
                            <p className="text-[15px] font-semibold text-white">
                              Новая задача
                            </p>
                            {mockNotifications.length > 2 && (
                              <motion.div
                                initial={false}
                                animate={{
                                  rotate: isAttentionExpanded ? 180 : 0,
                                }}
                                transition={{
                                  duration: 0.2,
                                  ease: [0.19, 1, 0.22, 1],
                                }}
                                className="ml-2 text-[#9098A7]"
                              >
                                <ChevronDown className="w-4 h-4" />
                              </motion.div>
                            )}
                          </div>

                          {/* Text первого уведомления */}
                          <p className="text-[13px] leading-snug text-white">
                            {mockNotifications[0].message}
                          </p>

                          {/* AddText + time / счётчик дополнительных уведомлений */}
                          <div className="flex items-center justify-between mt-1">
                            {mockNotifications[0].time && (
                              <p className="text-[12px] text-[#9098A7]">
                                {mockNotifications[0].time}
                              </p>
                            )}

                            {mockNotifications.length > 2 && !isAttentionExpanded && (
                              <p className="text-[12px] text-[#6CC0FF]">
                                Ещё {mockNotifications.length - 1} уведомлений
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Правый иконка-комментарий */}
                        <div className="flex-shrink-0 w-[37px] h-[37px] flex items-center justify-center">
                          <div className="w-[22px] h-[22px] rounded-full flex items-center justify-center">
                            <span className="block w-full h-full rounded-full bg-[#6CC0FF]" />
                          </div>
                        </div>
                      </div>

                      {/* Раскрытое состояние: список уведомлений */}
                      {mockNotifications.length > 2 && isAttentionExpanded && (
                        <motion.div
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{
                            duration: 0.2,
                            ease: [0.19, 1, 0.22, 1],
                          }}
                          className="mt-4 space-y-3 border-t border-white/5 pt-3"
                        >
                          {mockNotifications.slice(1).map((n, idx) => (
                            <div
                              key={`${n.title}-${idx}`}
                              className="flex items-start gap-3"
                            >
                              <div className="flex-shrink-0 w-[6px] h-[6px] rounded-full bg-[#6CC0FF] mt-[6px]" />
                              <div className="flex-1 min-w-0">
                                <p className="text-[13px] text-white leading-snug">
                                  {n.message}
                                </p>
                                {n.time && (
                                  <p className="mt-1 text-[12px] text-[#9098A7]">
                                    {n.time}
                                  </p>
                                )}
                              </div>
                            </div>
                          ))}
                        </motion.div>
                      )}
                    </button>
                  </motion.div>
                )}

                {/* Блок "Мой фокус" с градиентной карточкой */}
                <motion.section
                  initial={hasAnimated ? false : { opacity: 0, y: 20 }}
                  animate={hasAnimated ? { opacity: 1, y: 0 } : { opacity: 1, y: 0 }}
                  transition={
                    hasAnimated
                      ? { duration: 0 }
                      : {
                          duration: 0.35,
                          ease: [0.19, 1, 0.22, 1],
                        }
                  }
                  className="space-y-3"
                >
                  <div className="flex items-center justify-between px-1">
                    <h2 className="text-base font-semibold text-white">
                      Мой фокус
                    </h2>
                    <button
                      type="button"
                      onClick={() => router.push("/tasks")}
                      className="text-xs font-medium text-[#6CC0FF]"
                    >
                      Все задачи
                    </button>
                  </div>

                  <div className="rounded-[14px] p-4 bg-gradient-to-br from-[#232427] via-[#18191c] to-[#101113] border border-white/3">
                    {tasks.length > 0 ? (
                      <>
                        {/* Переключатель "Мои задачи" / "Все задачи проекта" */}
                        <div className="mb-4">
                          <div className="flex gap-1 p-1 bg-black/20 rounded-full">
                            <button
                              onClick={() => setTaskViewMode("my")}
                              className={cn(
                                "flex-1 py-1.5 px-3 rounded-full text-xs font-medium transition-all",
                                taskViewMode === "my"
                                  ? "bg-white text-black"
                                  : "text-[var(--tg-theme-hint-color)]"
                              )}
                            >
                              Мои задачи
                            </button>
                            <button
                              onClick={() => setTaskViewMode("all")}
                              className={cn(
                                "flex-1 py-1.5 px-3 rounded-full text-xs font-medium transition-all",
                                taskViewMode === "all"
                                  ? "bg-white text-black"
                                  : "text-[var(--tg-theme-hint-color)]"
                              )}
                            >
                              Все задачи проекта
                            </button>
                          </div>
                        </div>

                        <FocusTasks
                          tasks={tasks}
                          onTaskToggle={handleTaskToggle}
                          hideHeader
                          className="mb-0"
                        />
                      </>
                    ) : (
                      <motion.div
                        initial={hasAnimated ? false : { opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={
                          hasAnimated
                            ? { duration: 0 }
                            : {
                                duration: 0.25,
                                ease: [0.19, 1, 0.22, 1],
                              }
                        }
                        className="text-center py-6 px-4"
                      >
                        <p className="text-sm text-[var(--tg-theme-hint-color)]">
                          {taskViewMode === "my"
                            ? "Для тебя пока нет задач. Отдохни или проверь общий список."
                            : "Нет задач в проекте."}
                        </p>
                      </motion.div>
                    )}
                  </div>
                </motion.section>

                {/* Блок "Проекты" с градиентной карточкой */}
                <motion.section
                  initial={hasAnimated ? false : { opacity: 0, y: 20 }}
                  animate={hasAnimated ? { opacity: 1, y: 0 } : { opacity: 1, y: 0 }}
                  transition={
                    hasAnimated
                      ? { duration: 0 }
                      : {
                          duration: 0.35,
                          ease: [0.19, 1, 0.22, 1],
                        }
                  }
                  className="space-y-3"
                >
                  <div className="flex items-center justify-between px-1">
                    <h2 className="text-base font-semibold text-white">
                      Проекты
                    </h2>
                    <button
                      type="button"
                      onClick={() => router.push("/projects")}
                      className="text-xs font-medium text-[#6CC0FF]"
                    >
                      Все проекты
                    </button>
                  </div>

                  <div className="rounded-[14px] p-4 bg-gradient-to-br from-[#232427] via-[#18191c] to-[#101113] border border-white/3">
                    <ProjectsList
                      projects={projects}
                      onProjectClick={handleProjectClick}
                      hideHeader
                      className="mb-0"
                    />
                  </div>
                </motion.section>

                {/* Плашка с информацией о пользователе */}
                <motion.div
                  initial={hasAnimated ? false : { opacity: 0, y: 20 }}
                  animate={
                    hasAnimated ? { opacity: 1, y: 0 } : { opacity: 1, y: 0 }
                  }
                  transition={
                    hasAnimated
                      ? { duration: 0 }
                      : {
                          duration: 0.3,
                          ease: [0.19, 1, 0.22, 1],
                        }
                  }
                  className="mt-2 px-4 py-2 rounded-lg bg-[var(--tg-theme-secondary-bg-color)]/80 text-center"
                >
                  <p className="text-xs text-[var(--tg-theme-hint-color)]">
                    {user?.username ? `@${user.username}` : "Вход не выполнен"}
                  </p>
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Нижняя навигация */}
      <BottomNavigation />
    </div>
  );
}
