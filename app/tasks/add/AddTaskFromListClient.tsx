"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence, useMotionValue, PanInfo } from "framer-motion";
import {
  ArrowLeft,
  UserPlus,
  Paperclip,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  X,
  FolderOpen,
  User,
  Clock,
  Flame,
  MessageSquare,
  Hourglass,
  Bug,
  Lightbulb,
} from "lucide-react";
import { Task } from "@/types";
import AppHeader from "@/components/AppHeader";
import { supabase } from "@/lib/supabase";
import { haptics } from "@/lib/telegram";
import { useTelegramAuth } from "@/hooks/useTelegramAuth";
import { useHasAnimated } from "@/hooks/useHasAnimated";

interface Project {
  id: string;
  title: string;
}

interface ProjectMember {
  user_id: string;
  profiles: {
    avatar_url: string | null;
    username: string | null;
    position: string | null;
  } | null;
}

const DEMO_PROJECTS: Project[] = [
  { id: "demo-work", title: "Рабочий чат" },
  { id: "demo-life", title: "Личные дела" },
];

const DEMO_MEMBERS: ProjectMember[] = [
  {
    user_id: "demo-anna",
    profiles: {
      avatar_url: null,
      username: "Anna_designer",
      position: "Дизайнер",
    },
  },
];

const WEEKDAY_LABELS = ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];
const MONTH_NAMES = [
  "Январь", "Февраль", "Март", "Апрель", "Май", "Июнь",
  "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь",
];

const DAYS_RANGE = 90;

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

export default function AddTaskFromListClient() {
  const router = useRouter();
  const { user, isDemoMode } = useTelegramAuth();
  const hasAnimated = useHasAnimated();

  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [showProjectPicker, setShowProjectPicker] = useState(false);
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [taskTitle, setTaskTitle] = useState("");
  const [taskDescription, setTaskDescription] = useState("");
  const [selectedAssignees, setSelectedAssignees] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    const d = new Date();
    d.setHours(12, 0, 0, 0);
    return d;
  });
  const [selectedTime, setSelectedTime] = useState({ hour: 12, minute: 0 });
  const [noDeadline, setNoDeadline] = useState(true);
  const [dateOffset, setDateOffset] = useState(0);
  const [showMemberPicker, setShowMemberPicker] = useState(false);
  const [pickerMode, setPickerMode] = useState<"participants" | "responsible">("participants");
  const [selectedResponsibleId, setSelectedResponsibleId] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<NonNullable<Task['type']> | null>(null);

  const taskTypes = [
    { id: 'urgent', icon: Flame, color: '#EF4444' },
    { id: 'discuss', icon: MessageSquare, color: '#3B82F6' },
    { id: 'wait', icon: Hourglass, color: '#F59E0B' },
    { id: 'fix', icon: Bug, color: '#EC4899' },
    { id: 'idea', icon: Lightbulb, color: '#EAB308' },
  ] as const;

  const dateOptions = getDatesAround(dateOffset);
  const dateDragX = useMotionValue(0);

  const responsibleMember = members.find((m) => m.user_id === selectedResponsibleId);
  const responsibleProfile = responsibleMember
    ? (Array.isArray(responsibleMember.profiles) ? responsibleMember.profiles[0] : responsibleMember.profiles)
    : null;

  // Загрузка проектов
  useEffect(() => {
    if (isDemoMode) {
      setProjects(DEMO_PROJECTS);
      setLoading(false);
      return;
    }

    async function loadProjects() {
      if (!user?.id) {
        setLoading(false);
        return;
      }
      try {
        const { data, error } = await supabase
          .from("project_members")
          .select("project_id, projects(id, title)")
          .eq("user_id", user.id);

        if (error) throw error;

        const projectsList: Project[] = (data || [])
          .map((pm) => {
            const raw = pm.projects;
            const proj = Array.isArray(raw) ? raw[0] : (raw as { id: string; title: string } | null);
            return proj ? { id: proj.id, title: proj.title } : null;
          })
          .filter((p): p is Project => p !== null);

        setProjects(projectsList);
      } catch (e) {
        console.error("Error loading projects:", e);
      } finally {
        setLoading(false);
      }
    }
    loadProjects();
  }, [user?.id, isDemoMode]);

  // Загрузка участников при выборе проекта
  useEffect(() => {
    if (!selectedProject) {
      setMembers([]);
      return;
    }

    if (selectedProject.id.startsWith("demo-")) {
      setMembers(DEMO_MEMBERS);
      return;
    }

    async function loadMembers() {
      if (!selectedProject) return;
      try {
        const { data, error } = await supabase
          .from("project_members")
          .select("*, profiles(username, avatar_url, position)")
          .eq("project_id", selectedProject.id);

        if (error) throw error;
        setMembers((data as ProjectMember[]) || []);
      } catch (e) {
        console.error("Error loading members:", e);
      }
    }
    loadMembers();
  }, [selectedProject]);

  const handleSelectProject = (project: Project) => {
    haptics.light();
    setSelectedProject(project);
    setShowProjectPicker(false);
    setSelectedAssignees([]);
    setSelectedResponsibleId(null);
  };

  const handleAddParticipant = () => {
    haptics.light();
    setPickerMode("participants");
    setShowMemberPicker(true);
  };

  const handleOpenResponsiblePicker = () => {
    haptics.light();
    if (!selectedProject) return;
    setPickerMode("responsible");
    setShowMemberPicker(true);
  };

  const handleSelectMember = (userId: string) => {
    haptics.light();
    if (pickerMode === "responsible") {
      setSelectedResponsibleId((prev) => (prev === userId ? null : userId));
      setShowMemberPicker(false);
      return;
    }
    setSelectedAssignees((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const handleAddFiles = () => {
    haptics.light();
  };

  const handlePrevWeek = () => {
    haptics.light();
    setDateOffset((prev) => prev - 2);
  };

  const handleNextWeek = () => {
    haptics.light();
    setDateOffset((prev) => prev + 2);
  };

  const handlePrevMonth = () => {
    haptics.light();
    setDateOffset((prev) => {
      const d = new Date();
      d.setDate(d.getDate() + prev);
      const daysInPrevMonth = new Date(d.getFullYear(), d.getMonth(), 0).getDate();
      return prev - daysInPrevMonth;
    });
  };

  const handleNextMonth = () => {
    haptics.light();
    setDateOffset((prev) => {
      const d = new Date();
      d.setDate(d.getDate() + prev);
      const daysInCurrMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
      return prev + daysInCurrMonth;
    });
  };

  const handleDateDragEnd = (_: unknown, info: PanInfo) => {
    const swipeThreshold = 50;
    const swipeVelocityThreshold = 300;

    if (info.offset.x < -swipeThreshold || info.velocity.x < -swipeVelocityThreshold) {
      setDateOffset((prev) => prev + 2);
      haptics.light();
    } else if (info.offset.x > swipeThreshold || info.velocity.x > swipeVelocityThreshold) {
      setDateOffset((prev) => prev - 2);
      haptics.light();
    }

    dateDragX.set(0);
  };

  const handleSubmit = async () => {
    const titleTrimmed = taskTitle.trim();
    if (!titleTrimmed || !selectedProject) return;
    haptics.medium();
    setSubmitting(true);

    if (selectedProject.id.startsWith("demo-")) {
      setTimeout(() => {
        router.push("/tasks");
      }, 300);
      setSubmitting(false);
      return;
    }

    try {
      const deadline = noDeadline
        ? null
        : new Date(
            selectedDate.getFullYear(),
            selectedDate.getMonth(),
            selectedDate.getDate(),
            selectedTime.hour,
            selectedTime.minute
          ).toISOString();

      const title = titleTrimmed.slice(0, 200);
      const description = taskDescription.trim() || null;

      const { error } = await supabase.from("tasks").insert({
        project_id: selectedProject.id,
        creator_id: user?.id,
        assignee_id: selectedResponsibleId ?? selectedAssignees[0] ?? null,
        title,
        description: description || title,
        status: "todo",
        priority: "medium",
        task_type: selectedType,
        deadline,
      });

      if (error) throw error;
      router.push("/tasks");
    } catch (e) {
      console.error("Error creating task:", e);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[rgba(35,36,39,1)] flex items-center justify-center">
        <div className="text-white">Загрузка...</div>
      </div>
    );
  }

  return (
    <motion.div
      initial={hasAnimated ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={hasAnimated ? { duration: 0 } : { duration: 0.3, ease: [0.19, 1, 0.22, 1] }}
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
        className="mx-auto max-w-[390px] px-[18px] pb-32"
        style={{ paddingBottom: "calc(8rem + env(safe-area-inset-bottom))" }}
      >
        {/* 1. Выбор проекта */}
        <div className="mb-6">
          <h2 className="text-[#9097A7] text-[14px] font-medium mb-2">Проект</h2>
          <motion.button
            type="button"
            onClick={() => {
              haptics.light();
              setShowProjectPicker(true);
            }}
            whileTap={{ scale: 0.98 }}
            className="w-full rounded-[14px] bg-[#1E1F22] overflow-hidden"
          >
            <div className="flex items-center gap-3 px-4 py-4">
              {selectedProject ? (
                <>
                  <div className="w-12 h-12 rounded-full bg-[#3B82F6] flex items-center justify-center text-white text-xl font-medium flex-shrink-0">
                    {selectedProject.title.charAt(0).toUpperCase()}
                  </div>
                  <span className="flex-1 text-white font-medium truncate min-w-0 text-left">
                    {selectedProject.title}
                  </span>
                </>
              ) : (
                <>
                  <div className="w-12 h-12 rounded-full bg-[#3B82F6]/20 flex items-center justify-center flex-shrink-0">
                    <FolderOpen className="w-6 h-6 text-[#3B82F6]" strokeWidth={2} />
                  </div>
                  <span className="flex-1 text-[#3B82F6] font-medium text-left">
                    Выбрать проект
                  </span>
                </>
              )}
              <ChevronDown className="w-5 h-5 text-[#9097A7] flex-shrink-0" />
            </div>
          </motion.button>
        </div>

        {/* 2. Задача: два поля в одном бабле */}
        <div className="mb-6">
          <div className="rounded-[14px] bg-[#1E1F22] overflow-hidden divide-y divide-[#28292D]">
            <input
              type="text"
              value={taskTitle}
              onChange={(e) => setTaskTitle(e.target.value)}
              placeholder="Задача"
              className="w-full px-4 py-3 text-white placeholder:text-[#9097A7] text-[16px] outline-none bg-transparent"
            />
            <textarea
              value={taskDescription}
              onChange={(e) => setTaskDescription(e.target.value)}
              placeholder="Описание..."
              rows={3}
              className="w-full px-4 py-3 text-white placeholder:text-[#9097A7] text-[16px] outline-none resize-none bg-transparent"
            />
          </div>
        </div>

        {/* 3. Участники: только организатор + добавленные */}
        {selectedProject && (
          <div className="mb-6">
            <h2 className="text-white font-medium mb-2">Участники</h2>
            <div className="rounded-[14px] bg-[#1E1F22] overflow-hidden">
              <div className="divide-y divide-[#28292D]">
                {/* Организатор */}
                <div className="flex items-center gap-3 px-4 py-3">
                  {user?.avatar_url ? (
                    <img
                      src={user.avatar_url}
                      alt=""
                      className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-[#3B82F6] flex items-center justify-center text-white text-sm font-medium flex-shrink-0">
                      {(user?.username || "Вы").charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span className="flex-1 text-white font-medium truncate min-w-0">
                    {user?.username || "Вы"}
                  </span>
                  <span className="px-3 py-1 rounded-full text-[12px] font-medium flex-shrink-0 bg-[#BE87D8]/30 text-[#BE87D8]">
                    Организатор
                  </span>
                </div>
                {/* Добавленные участники */}
                {selectedAssignees.map((userId) => {
                  const member = members.find((m) => m.user_id === userId);
                  if (!member) return null;
                  const profile = Array.isArray(member.profiles)
                    ? member.profiles[0]
                    : member.profiles;
                  const name = profile?.username ?? "Участник";
                  const role = profile?.position ?? "Участник";
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
                      <span className="flex-1 text-white font-medium truncate min-w-0">
                        {name}
                      </span>
                      <span className="px-3 py-1 rounded-full text-[12px] font-medium flex-shrink-0 bg-[#28292D] text-[#9097A7]">
                        {role}
                      </span>
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
        )}

        {/* 4. Дедлайны */}
        <div className="mb-6">
          <h2 className="text-white font-medium mb-2">Дедлайны</h2>
          <div className="rounded-[14px] bg-[#1E1F22] overflow-hidden p-4">
            {/* Месяц и год */}
            <div className="flex items-center justify-center gap-3 mb-3">
              <motion.button
                type="button"
                onClick={handlePrevMonth}
                whileTap={{ scale: 0.9 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
                className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
              >
                <ChevronLeft className="w-4 h-4 text-[#9097A7]" />
              </motion.button>
              <span className="text-white font-medium text-[16px] min-w-[140px] text-center">
                {getMonthYearLabel(dateOffset)}
              </span>
              <motion.button
                type="button"
                onClick={handleNextMonth}
                whileTap={{ scale: 0.9 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
                className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
              >
                <ChevronRight className="w-4 h-4 text-[#9097A7]" />
              </motion.button>
            </div>
            {/* Date picker */}
            <div className="flex items-center gap-2 mb-4 pb-2">
              <motion.button
                type="button"
                onClick={handlePrevWeek}
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
                  onDragEnd={handleDateDragEnd}
                  animate={{ x: -dateOffset * 56 }}
                  style={{ x: dateDragX }}
                  transition={{
                    type: "spring",
                    stiffness: 300,
                    damping: 30,
                  }}
                  className="flex gap-2"
                >
                  {dateOptions.map((opt) => {
                    const isSelected =
                      selectedDate.getDate() === opt.date.getDate() &&
                      selectedDate.getMonth() === opt.date.getMonth() &&
                      selectedDate.getFullYear() === opt.date.getFullYear();
                    return (
                      <motion.button
                        key={opt.date.toISOString()}
                        type="button"
                        onClick={() => {
                          haptics.light();
                          const d = new Date(opt.date);
                          d.setHours(selectedTime.hour, selectedTime.minute, 0, 0);
                          setSelectedDate(d);
                        }}
                        whileTap={{ scale: 0.95 }}
                        transition={{ type: "spring", stiffness: 400, damping: 25 }}
                        className={`flex-shrink-0 flex flex-col items-center py-2 px-3 rounded-[10px] min-w-[48px] transition-colors duration-200 ${
                          isSelected ? "bg-[#BE87D8] text-white" : "bg-[#28292D] text-[#9097A7]"
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
                onClick={handleNextWeek}
                whileTap={{ scale: 0.9 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
                className="flex-shrink-0 w-8 h-8 rounded-full bg-[#28292D] flex items-center justify-center"
              >
                <ChevronRight className="w-4 h-4 text-[#9097A7]" />
              </motion.button>
            </div>
            {/* Time row */}
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={!noDeadline}
                  onChange={(e) => setNoDeadline(!e.target.checked)}
                  className="rounded border-[#28292D] bg-[#28292D]"
                />
                <span className="text-white text-[14px]">Время</span>
              </label>
              <input
                type="time"
                value={`${selectedTime.hour.toString().padStart(2, "0")}:${selectedTime.minute.toString().padStart(2, "0")}`}
                onChange={(e) => {
                  const [h, m] = e.target.value.split(":").map(Number);
                  setSelectedTime({ hour: h, minute: m });
                }}
                disabled={noDeadline}
                className="px-3 py-2 rounded-[10px] bg-[#28292D] text-white text-[14px] outline-none disabled:opacity-50"
              />
              <label className="flex items-center gap-2 cursor-pointer ml-auto">
                <input
                  type="checkbox"
                  checked={noDeadline}
                  onChange={(e) => setNoDeadline(e.target.checked)}
                  className="rounded border-[#28292D] bg-[#28292D]"
                />
                <span className="text-[#9097A7] text-[14px]">Без срока</span>
              </label>
            </div>
          </div>
        </div>

        {/* 5. Дополнительно: Ответственный + Файлы */}
        <div className="mb-8">
          <h2 className="text-white font-medium mb-2">Дополнительно</h2>
          <div className="rounded-[14px] bg-[#1E1F22] overflow-hidden divide-y divide-[#28292D]">
            <button
              type="button"
              onClick={handleOpenResponsiblePicker}
              disabled={!selectedProject}
              className="flex items-center gap-3 w-full px-4 py-3 text-left disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <div className="relative flex-shrink-0 w-10 h-10 rounded-full bg-[#6CC2FF]/20 flex items-center justify-center">
                <User className="w-5 h-5 text-[#6CC2FF]" strokeWidth={2} />
                <Clock className="absolute bottom-0 right-0 w-3.5 h-3.5 text-[#6CC2FF]" strokeWidth={2} />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-[14px] font-medium text-[#6CC2FF]">Ответственный</span>
                {!selectedProject ? (
                  <p className="text-[13px] text-[#9097A7] truncate mt-0.5">Сначала выберите проект</p>
                ) : responsibleProfile ? (
                  <p className="text-[13px] text-[#9097A7] truncate mt-0.5">
                    {responsibleProfile.username ?? "Участник"}
                  </p>
                ) : null}
              </div>
            </button>
            <button
              type="button"
              onClick={handleAddFiles}
              className="flex items-center gap-3 w-full px-4 py-3 text-[#3B82F6]"
            >
              <Paperclip className="w-5 h-5 flex-shrink-0" strokeWidth={2} />
              <span className="text-[14px] font-medium">Файлы</span>
            </button>
            <div className="flex items-center justify-between px-4 py-3">
              {taskTypes.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => {
                    haptics.light();
                    setSelectedType(selectedType === t.id ? null : t.id);
                  }}
                  className={`p-2 rounded-xl transition-all duration-200 ${
                    selectedType === t.id ? "bg-white/10 scale-110" : "hover:bg-white/5"
                  }`}
                >
                  <t.icon
                    className="w-6 h-6 transition-colors duration-200"
                    strokeWidth={selectedType === t.id ? 2.5 : 2}
                    color={selectedType === t.id ? t.color : "#9097A7"}
                  />
                </button>
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* Кнопка добавить */}
      <div
        className="fixed bottom-0 left-0 right-0 p-[18px] z-40"
        style={{
          paddingBottom: "calc(18px + env(safe-area-inset-bottom))",
        }}
      >
        <motion.button
          type="button"
          onClick={handleSubmit}
          disabled={!taskTitle.trim() || !selectedProject || submitting}
          className="w-full max-w-[390px] mx-auto flex items-center justify-center py-4 rounded-[14px] text-white font-medium text-[16px] disabled:opacity-50 disabled:cursor-not-allowed block"
          style={{ background: "linear-gradient(90deg, #4CAF50, #45a049)" }}
          whileTap={{ scale: 0.98 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
          {submitting ? "Создаём..." : "Добавить"}
        </motion.button>
      </div>

      {/* Модал выбора проекта */}
      <AnimatePresence>
        {showProjectPicker && (
          <>
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/60 z-50"
              onClick={() => setShowProjectPicker(false)}
            />
            {/* Bottom sheet */}
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed bottom-0 left-0 right-0 z-50 bg-[#1E1F22] rounded-t-[20px] max-h-[70vh] overflow-hidden"
              style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-4 border-b border-[#28292D]">
                <h3 className="text-white font-semibold text-[18px]">Выберите проект</h3>
                <button
                  onClick={() => setShowProjectPicker(false)}
                  className="w-8 h-8 rounded-full bg-[#28292D] flex items-center justify-center"
                >
                  <X className="w-4 h-4 text-[#9097A7]" />
                </button>
              </div>
              {/* Project list */}
              <div className="overflow-y-auto max-h-[calc(70vh-60px)]">
                {projects.length === 0 ? (
                  <div className="px-4 py-8 text-center text-[#9097A7]">
                    У вас пока нет проектов
                  </div>
                ) : (
                  <div className="divide-y divide-[#28292D]">
                    {projects.map((project) => (
                      <motion.button
                        key={project.id}
                        type="button"
                        onClick={() => handleSelectProject(project)}
                        whileTap={{ scale: 0.98 }}
                        className="flex items-center gap-3 px-4 py-4 w-full text-left"
                      >
                        <div className="w-12 h-12 rounded-full bg-[#3B82F6] flex items-center justify-center text-white text-xl font-medium flex-shrink-0">
                          {project.title.charAt(0).toUpperCase()}
                        </div>
                        <span className="flex-1 text-white font-medium truncate min-w-0">
                          {project.title}
                        </span>
                        {selectedProject?.id === project.id && (
                          <div className="w-6 h-6 rounded-full bg-[#4CAF50] flex items-center justify-center flex-shrink-0">
                            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        )}
                      </motion.button>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Нижний бар: выбор участника */}
      <AnimatePresence>
        {showMemberPicker && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/60 z-50"
              onClick={() => setShowMemberPicker(false)}
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed bottom-0 left-0 right-0 z-50 bg-[#1E1F22] rounded-t-[20px] max-h-[70vh] overflow-hidden"
              style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
            >
              <div className="flex items-center justify-between px-4 py-4 border-b border-[#28292D]">
                <h3 className="text-white font-semibold text-[18px]">
                  {pickerMode === "responsible" ? "Ответственный" : "Добавить участника"}
                </h3>
                <button
                  type="button"
                  onClick={() => setShowMemberPicker(false)}
                  className="w-8 h-8 rounded-full bg-[#28292D] flex items-center justify-center"
                >
                  <X className="w-4 h-4 text-[#9097A7]" />
                </button>
              </div>
              <div className="overflow-y-auto max-h-[calc(70vh-60px)]">
                {pickerMode === "responsible"
                  ? (members.length === 0 ? (
                      <div className="px-4 py-8 text-center text-[#9097A7]">
                        Нет участников в проекте
                      </div>
                    ) : (
                      <div className="divide-y divide-[#28292D]">
                        {members.map((member) => {
                          const profile = Array.isArray(member.profiles)
                            ? member.profiles[0]
                            : member.profiles;
                          const name = profile?.username ?? (member.user_id === user?.id ? "Вы" : "Участник");
                          const role = profile?.position ?? "Участник";
                          const avatarUrl = profile?.avatar_url;
                          const isSelected = selectedResponsibleId === member.user_id;
                          return (
                            <motion.button
                              key={member.user_id}
                              type="button"
                              onClick={() => handleSelectMember(member.user_id)}
                              whileTap={{ scale: 0.98 }}
                              className="flex items-center gap-3 px-4 py-4 w-full text-left"
                            >
                              {avatarUrl ? (
                                <img
                                  src={avatarUrl}
                                  alt=""
                                  className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                                />
                              ) : (
                                <div className="w-12 h-12 rounded-full bg-[#3B82F6] flex items-center justify-center text-white text-sm font-medium flex-shrink-0">
                                  {name.charAt(0).toUpperCase()}
                                </div>
                              )}
                              <span className="flex-1 text-white font-medium truncate min-w-0">
                                {name}
                              </span>
                              {isSelected ? (
                                <div className="w-6 h-6 rounded-full bg-[#4CAF50] flex items-center justify-center flex-shrink-0">
                                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                </div>
                              ) : (
                                <span className="px-3 py-1 rounded-full text-[12px] font-medium flex-shrink-0 bg-[#28292D] text-[#9097A7]">
                                  {role}
                                </span>
                              )}
                            </motion.button>
                          );
                        })}
                      </div>
                    ))
                  : (members.filter((m) => m.user_id !== user?.id).length === 0 ? (
                      <div className="px-4 py-8 text-center text-[#9097A7]">
                        Нет других участников в проекте
                      </div>
                    ) : (
                      <div className="divide-y divide-[#28292D]">
                        {members
                          .filter((m) => m.user_id !== user?.id)
                          .map((member) => {
                            const profile = Array.isArray(member.profiles)
                              ? member.profiles[0]
                              : member.profiles;
                            const name = profile?.username ?? "Участник";
                            const role = profile?.position ?? "Участник";
                            const avatarUrl = profile?.avatar_url;
                            const isSelected = selectedAssignees.includes(member.user_id);
                            return (
                              <motion.button
                                key={member.user_id}
                                type="button"
                                onClick={() => handleSelectMember(member.user_id)}
                                whileTap={{ scale: 0.98 }}
                                className="flex items-center gap-3 px-4 py-4 w-full text-left"
                              >
                                {avatarUrl ? (
                                  <img
                                    src={avatarUrl}
                                    alt=""
                                    className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                                  />
                                ) : (
                                  <div className="w-12 h-12 rounded-full bg-[#3B82F6] flex items-center justify-center text-white text-sm font-medium flex-shrink-0">
                                    {name.charAt(0).toUpperCase()}
                                  </div>
                                )}
                                <span className="flex-1 text-white font-medium truncate min-w-0">
                                  {name}
                                </span>
                                {isSelected ? (
                                  <div className="w-6 h-6 rounded-full bg-[#4CAF50] flex items-center justify-center flex-shrink-0">
                                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                  </div>
                                ) : (
                                  <span className="px-3 py-1 rounded-full text-[12px] font-medium flex-shrink-0 bg-[#28292D] text-[#9097A7]">
                                    {role}
                                  </span>
                                )}
                              </motion.button>
                            );
                          })}
                      </div>
                    ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
