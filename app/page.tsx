"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2 } from "lucide-react";
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

type TaskViewMode = "my" | "all";

export default function Home() {
  const { user, loading: authLoading } = useTelegramAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTasksCount, setActiveTasksCount] = useState(0);
  const [projectsCount, setProjectsCount] = useState(0);
  const [taskViewMode, setTaskViewMode] = useState<TaskViewMode>("my");
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

      // Загружаем задачи с информацией о проектах (топ-3 для "Мой Фокус")
      // Используем join для получения названия проекта
      let tasksQuery = supabase
        .from("tasks")
        .select("*, projects(title)")
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

      // Загружаем проекты
      const { data: projectsData, error: projectsError } = await supabase
        .from("projects")
        .select("*")
        .order("created_at", { ascending: false });

      if (projectsError) throw projectsError;

      // Загружаем количество проектов
      const { count: projectsCountData } = await supabase
        .from("projects")
        .select("*", { count: "exact", head: true });

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
    // TODO: Navigate to project page
    console.log("Project clicked:", projectId);
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
        className="container mx-auto px-4 py-6 pb-24"
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
              <div className="h-6 bg-[var(--tg-theme-hint-color)]/20 rounded animate-pulse w-1/3"></div>
              <div className="h-32 bg-[var(--tg-theme-secondary-bg-color)] rounded-xl animate-pulse"></div>
              <div className="h-32 bg-[var(--tg-theme-secondary-bg-color)] rounded-xl animate-pulse"></div>
            </motion.div>
          ) : (
            <motion.div
              key="content"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{
                duration: 0.4,
                ease: [0.19, 1, 0.22, 1],
              }}
            >
              {/* Блок уведомлений */}
              {mockNotifications.length > 0 && (
                <NotificationCard
                  title={mockNotifications[0].title}
                  message={mockNotifications[0].message}
                  time={mockNotifications[0].time}
                />
              )}

              {/* Переключатель "Мои задачи" / "Все задачи проекта" */}
              <div className="mb-6">
                <div className="flex gap-1 p-1 bg-[var(--tg-theme-secondary-bg-color)] rounded-xl">
                  <button
                    onClick={() => setTaskViewMode("my")}
                    className={cn(
                      "flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all",
                      taskViewMode === "my"
                        ? "bg-[var(--tg-theme-button-color)] text-white"
                        : "text-[var(--tg-theme-hint-color)] hover:text-[var(--tg-theme-text-color)]"
                    )}
                  >
                    Мои задачи
                  </button>
                  <button
                    onClick={() => setTaskViewMode("all")}
                    className={cn(
                      "flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all",
                      taskViewMode === "all"
                        ? "bg-[var(--tg-theme-button-color)] text-white"
                        : "text-[var(--tg-theme-hint-color)] hover:text-[var(--tg-theme-text-color)]"
                    )}
                  >
                    Все задачи проекта
                  </button>
                </div>
              </div>

              {/* Блок "Мой Фокус" */}
              {tasks.length > 0 ? (
                <FocusTasks tasks={tasks} onTaskToggle={handleTaskToggle} />
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.3,
                    ease: [0.19, 1, 0.22, 1],
                  }}
                  className="mb-6"
                >
                  <h2 className="text-lg font-semibold text-[var(--tg-theme-text-color)] mb-4">
                    Мой Фокус
                  </h2>
                  <div className="bg-[var(--tg-theme-secondary-bg-color)] rounded-xl p-8 text-center">
                    <p className="text-sm text-[var(--tg-theme-hint-color)]">
                      {taskViewMode === "my"
                        ? "Для тебя пока нет задач. Отдохни или проверь общий список."
                        : "Нет задач в проекте."}
                    </p>
                  </div>
                </motion.div>
              )}

              {/* Блок "Проекты" */}
              <ProjectsList
                projects={projects}
                onProjectClick={handleProjectClick}
              />

              {/* Плашка с информацией о пользователе */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.3,
                  ease: [0.19, 1, 0.22, 1],
                }}
                className="mt-6 px-4 py-2 rounded-lg bg-[var(--tg-theme-secondary-bg-color)] text-center"
              >
                <p className="text-xs text-[var(--tg-theme-hint-color)]">
                  {user?.username ? `@${user.username}` : "Вход не выполнен"}
                </p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Нижняя навигация */}
      <BottomNavigation />
    </div>
  );
}
