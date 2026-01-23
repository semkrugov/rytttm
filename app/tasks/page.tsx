"use client";

import { useState, useEffect } from "react";
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

export default function TasksPage() {
  const [activeStatus, setActiveStatus] = useState<TaskStatus>("todo");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  // Загрузка задач из Supabase
  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Преобразуем данные из Supabase в формат Task
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
        status: task.status as TaskStatus,
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

  const filteredTasks = tasks.filter((task) => task.status === activeStatus);

  const handleStatusChange = async (taskId: string, newStatus: TaskStatus) => {
    try {
      setUpdating(taskId);
      
      const { error } = await supabase
        .from("tasks")
        .update({ status: newStatus })
        .eq("id", taskId);

      if (error) throw error;

      // Обновляем локальное состояние
      setTasks((prevTasks) =>
        prevTasks.map((task) =>
          task.id === taskId ? { ...task, status: newStatus } : task
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
