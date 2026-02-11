"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence, useMotionValue, PanInfo } from "framer-motion";
import {
  ArrowLeft,
  Calendar,
  Play,
  Square,
  Link2,
  Pencil,
  X,
  ChevronLeft,
  ChevronRight,
  User,
  UserPlus,
  Check,
  Flame,
  MessageSquare,
  Hourglass,
  Bug,
  Lightbulb,
} from "lucide-react";

interface ProjectMember {
  user_id: string;
  profiles: {
    avatar_url: string | null;
    username: string | null;
    position: string | null;
  } | null;
}
import AppHeader from "@/components/AppHeader";
import { supabase } from "@/lib/supabase";
import { haptics } from "@/lib/telegram";
import { useHasAnimated } from "@/hooks/useHasAnimated";
import { useTimeTracking } from "@/contexts/TimeTrackingContext";

const WEEKDAY_LABELS = ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];
const MONTH_NAMES = [
  "Январь", "Февраль", "Март", "Апрель", "Май", "Июнь",
  "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь",
];
const DAYS_RANGE = 365;

function getDatesAround(centerOffset = 0) {
  const dates: { date: Date; day: number; weekday: string }[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (let i = -DAYS_RANGE; i <= DAYS_RANGE; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() + i + centerOffset);
    dates.push({
      date: d,
      day: d.getDate(),
      weekday: WEEKDAY_LABELS[d.getDay()],
    });
  }
  return dates;
}

function getMonthYearLabel(centerOffset: number): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + centerOffset);
  return `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`;
}

type TaskStatusEdit = "todo" | "doing" | "done";
const STATUS_LABELS: Record<TaskStatusEdit, string> = {
  todo: "К выполнению",
  doing: "В работе",
  done: "Готово",
};

const QUICK_STATUS_LABELS: Record<TaskStatusEdit, string> = {
  todo: "Не начал",
  doing: "В работе",
  done: "Готово",
};

interface TaskDetail {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  deadline: string | null;
  assignee_id: string | null;
  creator_id: string | null;
  project_id: string | null;
  confidence_score: number | null;
  time_tracking: number | null;
  is_tracking: boolean | null;
  task_type: string | null;
}

interface AssigneeProfile {
  id: string;
  username: string | null;
  avatar_url: string | null;
  position?: string | null;
}

interface TaskDetailPageClientProps {
  taskId: string;
}

export default function TaskDetailPageClient({ taskId }: TaskDetailPageClientProps) {
  const router = useRouter();
  const hasAnimated = useHasAnimated();
  const { activeTaskId, elapsedSeconds, startTracking, stopTracking } = useTimeTracking();

  const [task, setTask] = useState<TaskDetail | null>(null);
  const [assignee, setAssignee] = useState<AssigneeProfile | null>(null);
  const [creator, setCreator] = useState<AssigneeProfile | null>(null);
  const [projectTitle, setProjectTitle] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeElapsedStored, setTimeElapsedStored] = useState(0);

  const [showEditSheet, setShowEditSheet] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editStatus, setEditStatus] = useState<TaskStatusEdit>("todo");
  const [editNoDeadline, setEditNoDeadline] = useState(true);
  const [editSelectedDate, setEditSelectedDate] = useState<Date>(() => {
    const d = new Date();
    d.setHours(12, 0, 0, 0);
    return d;
  });
  const [editSelectedTime, setEditSelectedTime] = useState({ hour: 12, minute: 0 });
  const [editDateOffset, setEditDateOffset] = useState(0);
  const [editSaving, setEditSaving] = useState(false);
  const editDateOptions = useMemo(() => getDatesAround(0), []);
  const editDateDragX = useMotionValue(0);

  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [showMemberPicker, setShowMemberPicker] = useState(false);
  const [pickerMode, setPickerMode] = useState<"assignee" | "creator">("assignee");
  const [editAssigneeId, setEditAssigneeId] = useState<string | null>(null);
  const [editCreatorId, setEditCreatorId] = useState<string | null>(null);
  const [editType, setEditType] = useState<string | null>(null);

  const taskTypes = [
    { id: 'urgent', icon: Flame, color: '#EF4444' },
    { id: 'discuss', icon: MessageSquare, color: '#3B82F6' },
    { id: 'wait', icon: Hourglass, color: '#F59E0B' },
    { id: 'fix', icon: Bug, color: '#EC4899' },
    { id: 'idea', icon: Lightbulb, color: '#EAB308' },
  ] as const;

  async function loadProjectMembers() {
    if (!task?.project_id || taskId.startsWith("demo-")) return;
    if (members.length > 0) return;

    try {
      const { data: membersData, error: membersError } = await supabase
        .from("project_members")
        .select("*, profiles(username, avatar_url, position)")
        .eq("project_id", task.project_id);
      if (membersError) throw membersError;
      setMembers((membersData as any[]) || []);
    } catch (e) {
      console.error("Error loading members:", e);
    }
  }

  useEffect(() => {
    if (taskId) loadTask();
  }, [taskId]);

  const openEditSheet = () => {
    if (!task) return;
    haptics.medium();
    setEditTitle(task.title);
    setEditDescription(task.description || "");
    setEditStatus((task.status as TaskStatusEdit) || "todo");
    setEditAssigneeId(task.assignee_id);
    setEditCreatorId(task.creator_id);
    setEditType(task.task_type);
    loadProjectMembers();

    if (task.deadline) {
      const d = new Date(task.deadline);
      setEditNoDeadline(false);
      setEditSelectedDate(d);
      setEditSelectedTime({ hour: d.getHours(), minute: d.getMinutes() });
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      setEditDateOffset(Math.floor((d.getTime() - today.getTime()) / (24 * 60 * 60 * 1000)));
    } else {
      setEditNoDeadline(true);
      const d = new Date();
      d.setHours(12, 0, 0, 0);
      setEditSelectedDate(d);
      setEditSelectedTime({ hour: 12, minute: 0 });
      setEditDateOffset(0);
    }
    setShowEditSheet(true);
  };


  const handleEditPrevWeek = () => {
    haptics.light();
    setEditDateOffset((prev) => prev - 2);
  };
  const handleEditNextWeek = () => {
    haptics.light();
    setEditDateOffset((prev) => prev + 2);
  };
  const handleEditPrevMonth = () => {
    haptics.light();
    setEditDateOffset((prev) => {
      const d = new Date();
      d.setDate(d.getDate() + prev);
      const daysInPrevMonth = new Date(d.getFullYear(), d.getMonth(), 0).getDate();
      return prev - daysInPrevMonth;
    });
  };
  const handleEditNextMonth = () => {
    haptics.light();
    setEditDateOffset((prev) => {
      const d = new Date();
      d.setDate(d.getDate() + prev);
      const daysInCurrMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
      return prev + daysInCurrMonth;
    });
  };

  const handleEditDateDragEnd = (_: unknown, info: PanInfo) => {
    const swipeThreshold = 50;
    const swipeVelocityThreshold = 300;

    if (info.offset.x < -swipeThreshold || info.velocity.x < -swipeVelocityThreshold) {
      setEditDateOffset((prev) => prev + 2);
      haptics.light();
    } else if (info.offset.x > swipeThreshold || info.velocity.x > swipeVelocityThreshold) {
      setEditDateOffset((prev) => prev - 2);
      haptics.light();
    }

    // Сброс позиции драга
    editDateDragX.set(0);
  };

  const saveChanges = async () => {
    if (!task) return;
    const titleTrimmed = editTitle.trim();
    if (!titleTrimmed) return; // Cannot save empty title

    const deadline = editNoDeadline
      ? null
      : new Date(
          editSelectedDate.getFullYear(),
          editSelectedDate.getMonth(),
          editSelectedDate.getDate(),
          editSelectedTime.hour,
          editSelectedTime.minute
        ).toISOString();

    if (taskId.startsWith("demo-")) {
      setTask((prev) =>
        prev
          ? {
              ...prev,
              title: titleTrimmed,
              description: editDescription.trim() || null,
              status: editStatus,
              deadline,
              assignee_id: editAssigneeId,
              creator_id: editCreatorId,
              task_type: editType,
            }
          : null
      );
      return;
    }

    try {
      const { error } = await supabase
        .from("tasks")
        .update({
          title: titleTrimmed.slice(0, 200),
          description: editDescription.trim() || null,
          status: editStatus,
          deadline,
          assignee_id: editAssigneeId,
          creator_id: editCreatorId,
          task_type: editType,
        })
        .eq("id", taskId);
      if (error) throw error;
      loadTask();
    } catch (e) {
      console.error("Error updating task:", e);
    }
  };

  const handleEditSave = async () => {
    haptics.medium();
    setEditSaving(true);
    await saveChanges();
    setEditSaving(false);
    setShowEditSheet(false);
  };

  const closeEditSheet = () => {
    haptics.light();
    // Auto-save on close
    saveChanges(); 
    setShowEditSheet(false);
  };

  const isTrackingThisTask = activeTaskId === taskId;
  const timeElapsed = isTrackingThisTask ? elapsedSeconds : timeElapsedStored;

  const DEMO_TASKS: Record<string, TaskDetail> = {
    "demo-1": {
      id: "demo-1",
      title: "Сверстать демо-экран",
      description: null,
      status: "doing",
      priority: "medium",
      deadline: null,
      assignee_id: null,
      creator_id: null,
      project_id: null,
      confidence_score: null,
      time_tracking: 0,
      is_tracking: false,
      task_type: null,
    },
    "demo-2": {
      id: "demo-2",
      title: "Подключить платежи",
      description: null,
      status: "todo",
      priority: "medium",
      deadline: null,
      assignee_id: null,
      creator_id: null,
      project_id: null,
      confidence_score: null,
      time_tracking: 0,
      is_tracking: false,
      task_type: 'urgent',
    },
    "demo-3": {
      id: "demo-3",
      title: "Покормить кота",
      description: null,
      status: "todo",
      priority: "medium",
      deadline: null,
      assignee_id: null,
      creator_id: null,
      project_id: null,
      confidence_score: null,
      time_tracking: 0,
      is_tracking: false,
      task_type: 'idea',
    },
  };

  async function loadTask() {
    try {
      setLoading(true);

      if (taskId.startsWith("demo-") && DEMO_TASKS[taskId]) {
        setTask(DEMO_TASKS[taskId]);
        setLoading(false);
        return;
      }

      const { data: taskData, error: taskError } = await supabase
        .from("tasks")
        .select("*, projects(title)")
        .eq("id", taskId)
        .single();

      if (taskError) throw taskError;
      if (!taskData) throw new Error("Task not found");

      const projectTitleFromApi = (taskData as { projects?: { title: string } }).projects?.title ?? null;
      setTask({ ...taskData, project_id: taskData.project_id ?? null } as TaskDetail);
      setProjectTitle(projectTitleFromApi);
      setTimeElapsedStored(taskData.time_tracking || 0);

      if (taskData.assignee_id) {
        const { data: assigneeData } = await supabase
          .from("profiles")
          .select("id, username, avatar_url")
          .eq("id", taskData.assignee_id)
          .single();
        if (assigneeData) setAssignee(assigneeData as AssigneeProfile);
      }
      if (taskData.creator_id) {
        const { data: creatorData } = await supabase
          .from("profiles")
          .select("id, username, avatar_url")
          .eq("id", taskData.creator_id)
          .single();
        if (creatorData) setCreator(creatorData as AssigneeProfile);
      }
    } catch (e) {
      console.error("Error loading task:", e);
    } finally {
      setLoading(false);
    }
  }

  async function handleTimeTrackingToggle() {
    if (!task) return;
    haptics.medium();

    if (isTrackingThisTask) {
      const total = stopTracking();
      setTimeElapsedStored(total);
      if (!taskId.startsWith("demo-")) {
        try {
          await supabase
            .from("tasks")
            .update({ is_tracking: false, time_tracking: total })
            .eq("id", taskId);
        } catch (e) {
          console.error("Error stopping time tracking:", e);
        }
      }
    } else {
      if (activeTaskId) {
        const total = stopTracking();
        if (!activeTaskId.startsWith("demo-")) {
          try {
            await supabase
              .from("tasks")
              .update({ is_tracking: false, time_tracking: total })
              .eq("id", activeTaskId);
          } catch (e) {
            console.error("Error stopping previous time tracking:", e);
          }
        }
      }
      startTracking(taskId, timeElapsedStored);
      if (!taskId.startsWith("demo-")) {
        try {
          await supabase.from("tasks").update({ is_tracking: true }).eq("id", taskId);
        } catch (e) {
          console.error("Error starting time tracking:", e);
        }
      }
    }
  }

  async function handleQuickStatusChange(newStatus: TaskStatusEdit) {
    if (!task || task.status === newStatus) return;

    haptics.light();

    // Обновляем локально сразу для ощущения скорости
    setTask((prev) =>
      prev
        ? {
            ...prev,
            status: newStatus,
          }
        : prev
    );

    // Синхронизируем с БД (кроме демо-задач)
    if (taskId.startsWith("demo-")) return;

    try {
      const { error } = await supabase
        .from("tasks")
        .update({ status: newStatus })
        .eq("id", taskId);
      if (error) throw error;
    } catch (e) {
      console.error("Error updating task status:", e);
      // В случае ошибки перезагрузим данные задачи
      loadTask();
    }
  }

  function formatTimeShort(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  }

  function formatDeadlineRu(deadline: string | null): string {
    if (!deadline) return "";
    const d = new Date(deadline);
    const time = d.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
    const date = d.toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit" });
    return `${time} | ${date}`;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[rgba(35,36,39,1)] flex items-center justify-center">
        <div className="text-white">Загрузка...</div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="min-h-screen bg-[rgba(35,36,39,1)] flex items-center justify-center">
        <div className="text-white">Задача не найдена</div>
      </div>
    );
  }

  const deadlineStr = formatDeadlineRu(task.deadline);
  const timerStr = formatTimeShort(timeElapsed);

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
            className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center active:opacity-80 transition-opacity"
          >
            <ArrowLeft className="w-5 h-5 text-[#151617]" strokeWidth={2} />
          </button>
        }
        rightSlot={
          <button
            type="button"
            onClick={openEditSheet}
            className="w-10 h-10 rounded-full bg-[#1E1F22] flex items-center justify-center active:opacity-80 transition-opacity"
          >
            <Pencil className="w-5 h-5 text-white" strokeWidth={2} />
          </button>
        }
      />

      <main
        className="mx-auto max-w-[390px] px-[18px] pb-24"
        style={{ paddingBottom: "calc(6rem + env(safe-area-inset-bottom))" }}
      >
        {/* Дата и время дедлайна */}
        {deadlineStr && (
          <div className="flex items-center gap-2 text-[#9097A7] text-sm mb-2">
            <Calendar className="w-4 h-4 flex-shrink-0" strokeWidth={2} />
            <span>{deadlineStr}</span>
          </div>
        )}

        {/* Заголовок */}
        <h1 className="text-[22px] font-medium text-white leading-tight mb-2">
          {task.title}
        </h1>
        {task.description && (
          <p className="text-sm text-[#9097A7] leading-snug mb-6">
            {task.description}
          </p>
        )}

        {/* Таббар статуса задачи — как на странице всех задач */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-[#9097A7]">Статус задачи</p>
            {task.task_type && (
              <div className="flex items-center gap-2 px-2 py-1 rounded-lg bg-[#28292D]">
                {(() => {
                  const t = taskTypes.find(type => type.id === task.task_type);
                  if (!t) return null;
                  return (
                    <>
                      <t.icon className="w-4 h-4" color={t.color} />
                    </>
                  );
                })()}
              </div>
            )}
          </div>
          <motion.div
            className="flex w-full h-11 rounded-[14px] p-[3px] relative bg-[#1E1F22]"
            initial={false}
          >
            {(["todo", "doing", "done"] as const).map((status) => {
              const isActive = task.status === status;
              return (
                <motion.button
                  key={status}
                  type="button"
                  onClick={() => handleQuickStatusChange(status)}
                  className={`relative flex-1 h-full rounded-[12px] text-[14px] font-medium transition-colors z-10 ${
                    isActive ? "text-white" : "text-[#9097A7]"
                  }`}
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                >
                  {QUICK_STATUS_LABELS[status]}
                  {isActive && (
                    <motion.div
                      layoutId="activeTaskDetailStatusTab"
                      className="absolute inset-0 rounded-[12px] -z-10"
                      style={{
                        background:
                          "linear-gradient(90deg, #C3CBFF 0%, #F6B3FF 100%)",
                      }}
                      initial={false}
                      transition={{
                        type: "spring",
                        stiffness: 300,
                        damping: 30,
                      }}
                    />
                  )}
                </motion.button>
              );
            })}
          </motion.div>
        </div>

        {/* Таймер / воспроизведение */}
        <div className="flex items-center gap-4 mb-8">
          <motion.button
            type="button"
            onClick={handleTimeTrackingToggle}
            className="w-14 h-14 rounded-full border-2 border-[#22c55e] flex items-center justify-center bg-transparent flex-shrink-0"
            whileTap={{ scale: 0.96 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            {isTrackingThisTask ? (
              <Square
                className="w-6 h-6 text-[#22c55e]"
                strokeWidth={2}
                fill="currentColor"
              />
            ) : (
              <Play
                className="w-6 h-6 text-[#22c55e] ml-0.5"
                strokeWidth={2}
                fill="currentColor"
              />
            )}
          </motion.button>
          <span className="text-2xl font-bold text-[#22c55e] tabular-nums">
            {timerStr}
          </span>
        </div>

        {/* Выполняет */}
        <div className="mb-6">
          <p className="text-sm text-[#9097A7] mb-2">Выполняет</p>
          <div className="rounded-[14px] bg-[#1E1F22] overflow-hidden">
            <div className="flex items-center gap-3 px-4 py-3">
              {assignee?.avatar_url ? (
                <img
                  src={assignee.avatar_url}
                  alt=""
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-[#3B82F6] flex items-center justify-center text-white text-sm font-medium">
                  {(assignee?.username || "?")[0].toUpperCase()}
                </div>
              )}
              <span className="text-white font-medium truncate">
                {assignee?.username ?? "Не назначен"}
              </span>
            </div>
          </div>
        </div>

        {/* Ответственный */}
        <div className="mb-6">
          <p className="text-sm text-[#9097A7] mb-2">Ответственный</p>
          <div className="rounded-[14px] bg-[#1E1F22] overflow-hidden">
            <div className="flex items-center gap-3 px-4 py-3">
              {creator?.avatar_url ? (
                <img
                  src={creator.avatar_url}
                  alt=""
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-[#F97316] flex items-center justify-center text-white text-sm font-medium">
                  {(creator?.username || "?")[0].toUpperCase()}
                </div>
              )}
              <span className="text-white font-medium truncate">
                {creator?.username ?? "—"}
              </span>
            </div>
          </div>
        </div>

        {/* Дополнительно */}
        <div>
          <p className="text-sm text-[#9097A7] mb-2">Дополнительно</p>
          <div className="space-y-2">
            {projectTitle && (
              <div className="rounded-[14px] bg-[#1E1F22] overflow-hidden">
                <div className="flex items-center gap-3 px-4 py-3">
                  <div className="w-10 h-10 rounded-full bg-[#3B82F6] flex items-center justify-center text-white text-sm font-medium">
                    T
                  </div>
                  <span className="text-white font-medium truncate">
                    {projectTitle}
                  </span>
                </div>
              </div>
            )}
            {/* Плейсхолдер файла — можно заменить на реальные вложения */}
            <div className="rounded-[14px] bg-[#1E1F22] overflow-hidden">
              <div className="flex items-center gap-3 px-4 py-3">
                <Link2 className="w-5 h-5 text-[#9097A7] flex-shrink-0" strokeWidth={2} />
                <span className="text-white font-medium truncate">File_name.pdf</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Редактирование задачи — нижняя панель */}
      <AnimatePresence>
        {showEditSheet && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/60 z-50"
              onClick={closeEditSheet}
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed bottom-0 left-0 right-0 z-50 bg-[rgba(35,36,39,1)] rounded-t-[20px] max-h-[85vh] overflow-hidden flex flex-col"
              style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
            >
              <div className="flex items-center justify-between px-4 py-4 border-b border-[#28292D] flex-shrink-0">
                <h3 className="text-white font-semibold text-[18px]">Редактировать задачу</h3>
                <button
                  type="button"
                  onClick={closeEditSheet}
                  className="w-10 h-10 rounded-full bg-[#1E1F22] flex items-center justify-center active:opacity-80"
                >
                  <X className="w-5 h-5 text-[#9097A7]" strokeWidth={2} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto px-[18px] pb-4">
                <div className="rounded-[14px] bg-[#1E1F22] overflow-hidden divide-y divide-[#28292D] mb-4">
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    placeholder="Название задачи"
                    className="w-full px-4 py-3 text-white placeholder:text-[#9097A7] text-[16px] outline-none bg-transparent"
                  />
                  <textarea
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    placeholder="Описание..."
                    rows={3}
                    className="w-full px-4 py-3 text-white placeholder:text-[#9097A7] text-[16px] outline-none resize-none bg-transparent"
                  />
                </div>

                <p className="text-[#9097A7] text-[14px] font-medium mb-2">Статус</p>
                <div className="flex gap-2 mb-4">
                  {(["todo", "doing", "done"] as const).map((status) => (
                    <motion.button
                      key={status}
                      type="button"
                      onClick={() => {
                        haptics.light();
                        setEditStatus(status);
                      }}
                      whileTap={{ scale: 0.97 }}
                      transition={{ type: "spring", stiffness: 400, damping: 25 }}
                      className={`flex-1 py-2.5 px-3 rounded-[14px] text-[14px] font-medium transition-colors ${
                        editStatus === status
                          ? "bg-[#6CC2FF] text-white"
                          : "bg-[#28292D] text-[#9097A7]"
                      }`}
                    >
                      {STATUS_LABELS[status]}
                    </motion.button>
                  ))}
                </div>

                <p className="text-[#9097A7] text-[14px] font-medium mb-2">Тип задачи</p>
                <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-2">
                  {taskTypes.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => {
                        haptics.light();
                        setEditType(editType === t.id ? null : t.id);
                      }}
                      className={`p-3 rounded-xl transition-all duration-200 flex-shrink-0 ${
                        editType === t.id ? "bg-[#3B82F6]/20 border border-[#3B82F6]" : "bg-[#28292D] border border-transparent"
                      }`}
                    >
                      <t.icon
                        className="w-5 h-5"
                        strokeWidth={editType === t.id ? 2.5 : 2}
                        color={editType === t.id ? t.color : "#9097A7"}
                      />
                    </button>
                  ))}
                </div>

                <p className="text-white font-medium mb-2">Дедлайн</p>
                <div className="rounded-[14px] bg-[#1E1F22] overflow-hidden p-4 mb-4">
                  <div className="flex items-center justify-center gap-3 mb-3">
                    <motion.button
                      type="button"
                      onClick={handleEditPrevMonth}
                      whileTap={{ scale: 0.9 }}
                      transition={{ type: "spring", stiffness: 400, damping: 25 }}
                      className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                    >
                      <ChevronLeft className="w-4 h-4 text-[#9097A7]" />
                    </motion.button>
                    <span className="text-white font-medium text-[16px] min-w-[140px] text-center">
                      {getMonthYearLabel(editDateOffset)}
                    </span>
                    <motion.button
                      type="button"
                      onClick={handleEditNextMonth}
                      whileTap={{ scale: 0.9 }}
                      transition={{ type: "spring", stiffness: 400, damping: 25 }}
                      className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                    >
                      <ChevronRight className="w-4 h-4 text-[#9097A7]" />
                    </motion.button>
                  </div>
                  <div className="flex items-center gap-2 mb-4 pb-2">
                    <motion.button
                      type="button"
                      onClick={handleEditPrevWeek}
                      whileTap={{ scale: 0.9 }}
                      transition={{ type: "spring", stiffness: 400, damping: 25 }}
                      className="flex-shrink-0 w-8 h-8 rounded-full bg-[#28292D] flex items-center justify-center"
                    >
                      <ChevronLeft className="w-4 h-4 text-[#9097A7]" />
                    </motion.button>
                    <div className="flex-1 min-w-0 overflow-hidden relative">
                      <motion.div
                        drag="x"
                        dragConstraints={{ left: 0, right: 0 }}
                        dragElastic={0.2}
                        onDragEnd={handleEditDateDragEnd}
                        animate={{ x: -(DAYS_RANGE + editDateOffset) * 56 }}
                        style={{ x: editDateDragX }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        className="flex gap-2"
                      >
                        {editDateOptions.map((opt) => {
                          const isSelected =
                            editSelectedDate.getDate() === opt.date.getDate() &&
                            editSelectedDate.getMonth() === opt.date.getMonth() &&
                            editSelectedDate.getFullYear() === opt.date.getFullYear();
                          return (
                            <motion.button
                              key={opt.date.toISOString()}
                              type="button"
                              onClick={() => {
                                haptics.light();
                                const d = new Date(opt.date);
                                d.setHours(editSelectedTime.hour, editSelectedTime.minute, 0, 0);
                                setEditSelectedDate(d);
                              }}
                              whileTap={{ scale: 0.95 }}
                              transition={{ type: "spring", stiffness: 400, damping: 25 }}
                              className={`flex-shrink-0 flex flex-col items-center py-2 px-3 rounded-[14px] min-w-[48px] transition-colors duration-200 ${
                                isSelected ? "bg-[#6CC2FF] text-white" : "bg-[#28292D] text-[#9097A7]"
                              }`}
                            >
                              <span className="text-[11px]">{opt.weekday}</span>
                              <span className="text-[16px] font-semibold">{opt.day}</span>
                            </motion.button>
                          );
                        })}
                      </motion.div>
                    </div>
                    <motion.button
                      type="button"
                      onClick={handleEditNextWeek}
                      whileTap={{ scale: 0.9 }}
                      transition={{ type: "spring", stiffness: 400, damping: 25 }}
                      className="flex-shrink-0 w-8 h-8 rounded-full bg-[#28292D] flex items-center justify-center"
                    >
                      <ChevronRight className="w-4 h-4 text-[#9097A7]" />
                    </motion.button>
                  </div>
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={!editNoDeadline}
                        onChange={(e) => setEditNoDeadline(!e.target.checked)}
                        className="rounded border-[#28292D] bg-[#28292D]"
                      />
                      <span className="text-white text-[14px]">Время</span>
                    </label>
                    <input
                      type="time"
                      value={`${editSelectedTime.hour.toString().padStart(2, "0")}:${editSelectedTime.minute.toString().padStart(2, "0")}`}
                      onChange={(e) => {
                        const [h, m] = e.target.value.split(":").map(Number);
                        setEditSelectedTime({ hour: h, minute: m });
                      }}
                      disabled={editNoDeadline}
                      className="px-3 py-2 rounded-[14px] bg-[#28292D] text-white text-[14px] outline-none disabled:opacity-50"
                    />
                    <label className="flex items-center gap-2 cursor-pointer ml-auto">
                      <input
                        type="checkbox"
                        checked={editNoDeadline}
                        onChange={(e) => setEditNoDeadline(e.target.checked)}
                        className="rounded border-[#28292D] bg-[#28292D]"
                      />
                      <span className="text-[#9097A7] text-[14px]">Без срока</span>
                    </label>
                  </div>
                </div>

                <div className="rounded-[14px] bg-[#1E1F22] overflow-hidden divide-y divide-[#28292D] mb-4">
                  <button
                    type="button"
                    onClick={() => {
                      haptics.light();
                      setPickerMode("assignee");
                      setShowMemberPicker(true);
                    }}
                    className="flex items-center gap-3 w-full px-4 py-3 text-left active:bg-[#28292D] transition-colors"
                  >
                    <div className="w-10 h-10 rounded-full bg-[#3B82F6] flex items-center justify-center text-white text-sm font-medium flex-shrink-0">
                      {(() => {
                        const m = members.find((m) => m.user_id === editAssigneeId);
                        const p = m?.profiles
                          ? Array.isArray(m.profiles)
                            ? m.profiles[0]
                            : m.profiles
                          : null;
                        return (p?.username || "?")[0]?.toUpperCase();
                      })()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-[14px] text-[#9097A7]">Исполнитель</span>
                      <p className="text-white font-medium truncate">
                        {(() => {
                          const m = members.find((m) => m.user_id === editAssigneeId);
                          const p = m?.profiles
                            ? Array.isArray(m.profiles)
                              ? m.profiles[0]
                              : m.profiles
                            : null;
                          return p?.username || "Не назначен";
                        })()}
                      </p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-[#505050]" />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      haptics.light();
                      setPickerMode("creator");
                      setShowMemberPicker(true);
                    }}
                    className="flex items-center gap-3 w-full px-4 py-3 text-left active:bg-[#28292D] transition-colors"
                  >
                    <div className="w-10 h-10 rounded-full bg-[#F97316] flex items-center justify-center text-white text-sm font-medium flex-shrink-0">
                      {(() => {
                        const m = members.find((m) => m.user_id === editCreatorId);
                        const p = m?.profiles
                          ? Array.isArray(m.profiles)
                            ? m.profiles[0]
                            : m.profiles
                          : null;
                        return (p?.username || "?")[0]?.toUpperCase();
                      })()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-[14px] text-[#9097A7]">Ответственный</span>
                      <p className="text-white font-medium truncate">
                        {(() => {
                          const m = members.find((m) => m.user_id === editCreatorId);
                          const p = m?.profiles
                            ? Array.isArray(m.profiles)
                              ? m.profiles[0]
                              : m.profiles
                            : null;
                          return p?.username || "Не назначен";
                        })()}
                      </p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-[#505050]" />
                  </button>
                </div>
              </div>

              <div className="px-[18px] py-3 flex-shrink-0 border-t border-[#28292D]">
                <motion.button
                  type="button"
                  onClick={handleEditSave}
                  disabled={!editTitle.trim() || editSaving}
                  className="w-full py-4 rounded-[14px] text-white font-medium text-[16px] disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ background: "linear-gradient(90deg, #4CAF50, #45a049)" }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                >
                  {editSaving ? "Сохранение..." : "Сохранить"}
                </motion.button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Выбор участника */}
      <AnimatePresence>
        {showMemberPicker && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/60 z-[60]"
              onClick={() => {
                haptics.light();
                setShowMemberPicker(false);
              }}
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed bottom-0 left-0 right-0 z-[60] bg-[#1E1F22] rounded-t-[20px] max-h-[70vh] overflow-hidden flex flex-col"
              style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
            >
              <div className="flex items-center justify-between px-4 py-4 border-b border-[#28292D] flex-shrink-0">
                <h3 className="text-white font-semibold text-[18px]">
                  {pickerMode === "assignee" ? "Выберите исполнителя" : "Выберите ответственного"}
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    haptics.light();
                    setShowMemberPicker(false);
                  }}
                  className="w-10 h-10 rounded-full bg-[#28292D] flex items-center justify-center active:opacity-80"
                >
                  <X className="w-5 h-5 text-[#9097A7]" strokeWidth={2} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto px-4 pb-4">
                <div className="space-y-1 mt-2">
                  {members.map((member) => {
                    const profile = Array.isArray(member.profiles)
                      ? member.profiles[0]
                      : member.profiles;
                    const isSelected =
                      pickerMode === "assignee"
                        ? editAssigneeId === member.user_id
                        : editCreatorId === member.user_id;

                    return (
                      <button
                        key={member.user_id}
                        type="button"
                        onClick={() => {
                          haptics.selection();
                          if (pickerMode === "assignee") {
                            setEditAssigneeId(member.user_id);
                          } else {
                            setEditCreatorId(member.user_id);
                          }
                          setShowMemberPicker(false);
                        }}
                        className={`w-full flex items-center gap-3 px-3 py-3 rounded-[12px] transition-colors ${
                          isSelected ? "bg-[#28292D]" : "active:bg-[#28292D]"
                        }`}
                      >
                        {profile?.avatar_url ? (
                          <img
                            src={profile.avatar_url}
                            alt=""
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-medium ${
                            pickerMode === "assignee" ? "bg-[#3B82F6]" : "bg-[#F97316]"
                          }`}>
                            {(profile?.username || "?")[0]?.toUpperCase()}
                          </div>
                        )}
                        <div className="flex-1 text-left">
                          <p className="text-white font-medium text-[15px]">
                            {profile?.username || "Без имени"}
                          </p>
                          <p className="text-[#9097A7] text-[13px]">
                            {profile?.position || "Участник"}
                          </p>
                        </div>
                        {isSelected && (
                          <Check className="w-5 h-5 text-[#3B82F6]" strokeWidth={2.5} />
                        )}
                      </button>
                    );
                  })}

                  {members.length === 0 && (
                    <div className="text-center py-8 text-[#9097A7]">
                      Нет участников в проекте
                    </div>
                  )}
                  
                  {/* Кнопка сброса (не назначен) */}
                  <button
                    type="button"
                    onClick={() => {
                      haptics.selection();
                      if (pickerMode === "assignee") {
                        setEditAssigneeId(null);
                      } else {
                        setEditCreatorId(null);
                      }
                      setShowMemberPicker(false);
                    }}
                    className="w-full flex items-center gap-3 px-3 py-3 rounded-[12px] active:bg-[#28292D] transition-colors mt-2 border-t border-[#28292D]"
                  >
                    <div className="w-10 h-10 rounded-full bg-[#28292D] flex items-center justify-center text-[#9097A7]">
                      <X className="w-5 h-5" />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="text-[#9097A7] font-medium text-[15px]">
                        Не назначен
                      </p>
                    </div>
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
