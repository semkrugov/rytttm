"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Loader2 } from "lucide-react";
import BottomNavigation from "@/components/BottomNavigation";
import StatusTabs from "@/components/StatusTabs";
import TaskCard from "@/components/TaskCard";
import TaskCardSkeleton from "@/components/TaskCardSkeleton";
import { Task, TaskStatus } from "@/types";
import { supabase } from "@/lib/supabase";
import { animationVariants } from "@/lib/animations";
import { haptics } from "@/lib/telegram";
import WebApp from "@twa-dev/sdk";

export default function TasksPage() {
  const [activeStatus, setActiveStatus] = useState<TaskStatus>("todo");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [projectId, setProjectId] = useState<string | null>(null);
  const channelRef = useRef<any>(null);

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

  // Загрузка задач из Supabase
  useEffect(() => {
    if (projectId !== null) {
      loadTasks();
    }
  }, [projectId]);

  // Realtime подписка на изменения задач
  useEffect(() => {
    if (!projectId) return;

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
          filter: projectId ? `project_id=eq.${projectId}` : undefined,
        },
        (payload) => {
          console.log("Realtime событие:", payload);
          loadTasks();
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [projectId]);

  const loadTasks = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from("tasks")
        .select("*")
        .order("created_at", { ascending: false });

      // Фильтруем по project_id, если он определен
      if (projectId) {
        query = query.eq("project_id", projectId);
      }

      const { data, error } = await query;

      if (error) throw error;

      console.log("Загруженные задачи:", data);

      // Преобразуем данные из Supabase в формат Task
      // В базе нет поля status, поэтому используем дефолтное значение "todo"
      const formattedTasks: Task[] = (data || []).map((task: any) => ({
        id: task.id,
        title: task.title,
        project: task.project_id,
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
        status: (task.status as TaskStatus) || "todo", // Дефолтное значение, если status отсутствует
        timeTracking: task.time_tracking
          ? formatTimeTracking(task.time_tracking)
          : undefined,
        isTracking: task.is_tracking || false,
        completed: task.status === "done",
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

  // Фильтруем задачи по статусу
  // Если в базе нет поля status, все задачи считаются "todo"
  const filteredTasks = tasks.filter((task) => {
    // Если статус не определен, показываем как "todo"
    const taskStatus = task.status || "todo";
    return taskStatus === activeStatus;
  });

  const handleStatusChange = async (taskId: string, newStatus: TaskStatus) => {
    try {
      setUpdating(taskId);
      
      // В базе нет поля status, поэтому обновляем только локальное состояние
      // TODO: Добавить поле status в таблицу tasks или использовать другое поле
      console.warn("Попытка обновить status, но поле отсутствует в базе данных");

      // Обновляем локальное состояние
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
    if (typeof window !== "undefined") {
      haptics.light();
    }

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

  const handleAddTask = () => {
    if (typeof window !== "undefined") {
      haptics.medium();
    }
    // TODO: Open add task modal
    console.log("Add task");
  };

  return (
    <div className="min-h-screen bg-[var(--tg-theme-bg-color)]">
      <main
        className="container mx-auto px-4 py-6 pb-24"
        style={{
          paddingBottom: "calc(6rem + env(safe-area-inset-bottom))",
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.4,
            ease: [0.19, 1, 0.22, 1],
          }}
        >
          <h1 className="text-2xl font-bold text-[var(--tg-theme-text-color)] mb-6">
            Задачи
          </h1>

          {/* Табы статусов */}
          <StatusTabs
            activeStatus={activeStatus}
            onStatusChange={setActiveStatus}
          />

          {/* Список задач */}
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
                transition={{
                  duration: 0.3,
                  ease: [0.19, 1, 0.22, 1],
                }}
              >
                <AnimatePresence mode="popLayout">
                  <motion.div
                    variants={animationVariants.staggerContainer}
                    initial="initial"
                    animate="animate"
                  >
                    {filteredTasks.length > 0 ? (
                      filteredTasks.map((task) => (
                        <AnimatePresence key={task.id} mode="wait">
                          {updating === task.id ? (
                            <motion.div
                              key={`loading-${task.id}`}
                              initial={{ opacity: 0, scale: 0.95 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.95 }}
                              transition={{
                                duration: 0.2,
                                ease: [0.19, 1, 0.22, 1],
                              }}
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
                        key="empty"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{
                          duration: 0.3,
                          ease: [0.19, 1, 0.22, 1],
                        }}
                        className="text-center py-12"
                      >
                        <p className="text-[var(--tg-theme-hint-color)]">
                          Нет задач в этом статусе
                        </p>
                      </motion.div>
                    )}
                  </motion.div>
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Кнопка добавления задачи */}
          <motion.button
            onClick={handleAddTask}
            className="fixed bottom-24 right-4 w-14 h-14 rounded-full bg-[var(--tg-theme-button-color)] flex items-center justify-center shadow-lg z-40"
            style={{
              bottom: "calc(6rem + env(safe-area-inset-bottom))",
            }}
            whileTap={{ scale: 0.9 }}
            whileHover={{ scale: 1.05 }}
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

      {/* Нижняя навигация */}
      <BottomNavigation />
    </div>
  );
}
