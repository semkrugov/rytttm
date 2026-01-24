"use client";

import { useState, useEffect } from "react";
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
import WebApp from "@twa-dev/sdk";

export default function Home() {
  const { user, loading: authLoading } = useTelegramAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTasksCount, setActiveTasksCount] = useState(0);
  const [projectsCount, setProjectsCount] = useState(0);
  const [projectId, setProjectId] = useState<string | null>(null);

  // Отладка статуса пользователя
  useEffect(() => {
    console.log("User status:", user);
  }, [user]);

  // Определяем project_id из Telegram чата
  useEffect(() => {
    const determineProjectId = async () => {
      if (typeof window === "undefined") return;

      try {
        // Пытаемся получить chat_id из Telegram WebApp
        const chatId = (WebApp.initDataUnsafe as any)?.chat?.id;
        
        if (chatId) {
          // Ищем проект по telegram_chat_id
          const { data: project, error } = await supabase
            .from("projects")
            .select("id")
            .eq("telegram_chat_id", chatId)
            .single();

          if (error) {
            console.error("Error finding project:", error);
            return;
          }

          if (project) {
            console.log("Определен project_id из Telegram чата:", project.id);
            setProjectId(project.id);
          }
        } else {
          console.warn("Chat ID не найден в Telegram WebApp. Показываем все задачи.");
        }
      } catch (error) {
        console.error("Error determining project ID:", error);
      }
    };

    determineProjectId();
  }, []);

  useEffect(() => {
    if (projectId !== null) {
      loadData();
    }
  }, [projectId]);

  const loadData = async () => {
    try {
      setLoading(true);

      // Загружаем задачи (топ-3 для "Мой Фокус")
      // В базе нет поля status, поэтому загружаем все задачи
      let tasksQuery = supabase
        .from("tasks")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(3);

      // Фильтруем по project_id, если он определен
      if (projectId) {
        tasksQuery = tasksQuery.eq("project_id", projectId);
      }

      const { data: tasksData, error: tasksError } = await tasksQuery;

      if (tasksError) throw tasksError;

      console.log("Загруженные задачи на главной:", tasksData);

      // Загружаем все задачи для подсчета
      let countQuery = supabase
        .from("tasks")
        .select("*", { count: "exact", head: true });

      if (projectId) {
        countQuery = countQuery.eq("project_id", projectId);
      }

      const { count: activeCount } = await countQuery;

      // Загружаем проекты
      // В базе нет поля status, поэтому загружаем все проекты
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

              {/* Блок "Мой Фокус" */}
              <FocusTasks tasks={tasks} onTaskToggle={handleTaskToggle} />

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
