"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  UserPlus,
  Paperclip,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import AppHeader from "@/components/AppHeader";
import { supabase } from "@/lib/supabase";
import { haptics } from "@/lib/telegram";
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

const DEMO_PROJECTS: Record<string, { id: string; title: string }> = {
  "demo-work": { id: "demo-work", title: "Team_chat_project78" },
  "demo-life": { id: "demo-life", title: "Личные дела" },
};

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

function getDatesAround(centerOffset = 0) {
  const dates: { date: Date; day: number; weekday: string }[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  // Генерируем больший диапазон дат для плавной прокрутки
  for (let i = -10; i <= 10; i++) {
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

interface AddTaskPageClientProps {
  projectId: string;
}

export default function AddTaskPageClient({ projectId }: AddTaskPageClientProps) {
  const router = useRouter();
  const { user } = useTelegramAuth();
  const hasAnimated = useHasAnimated();

  const [project, setProject] = useState<{ id: string; title: string } | null>(null);
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
  const [noDeadline, setNoDeadline] = useState(false);
  const [dateOffset, setDateOffset] = useState(0);

  const dateOptions = getDatesAround(dateOffset);

  useEffect(() => {
    if (!projectId) return;

    if (projectId.startsWith("demo-") && DEMO_PROJECTS[projectId]) {
      setProject(DEMO_PROJECTS[projectId]);
      setMembers(DEMO_MEMBERS);
      setLoading(false);
      return;
    }

    async function load() {
      if (!user?.id) {
        setLoading(false);
        return;
      }
      try {
        const { data: projectData, error: projectError } = await supabase
          .from("projects")
          .select("id, title")
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
      } catch (e) {
        console.error("Error loading project:", e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [projectId, user?.id]);

  const handleAddParticipant = () => {
    haptics.light();
    // TODO: открыть модал добавления участника
  };

  const handleAddFiles = () => {
    haptics.light();
    // TODO: открыть выбор файлов
  };

  const toggleAssignee = (userId: string) => {
    haptics.light();
    setSelectedAssignees((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const handlePrevWeek = () => {
    haptics.light();
    setDateOffset((prev) => prev - 3);
  };

  const handleNextWeek = () => {
    haptics.light();
    setDateOffset((prev) => prev + 3);
  };

  const handleSubmit = async () => {
    const titleTrimmed = taskTitle.trim();
    if (!titleTrimmed) return;
    haptics.medium();
    setSubmitting(true);

    if (projectId.startsWith("demo-")) {
      setTimeout(() => {
        router.push(`/projects/${projectId}`);
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
        project_id: projectId,
        creator_id: user?.id,
        assignee_id: selectedAssignees[0] || null,
        title,
        description: description || title,
        status: "todo",
        priority: "medium",
        deadline,
      });

      if (error) throw error;
      router.push(`/projects/${projectId}`);
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
        {/* 1. Название проекта */}
        <div className="mb-6">
          <h2 className="text-[#9097A7] text-[14px] font-medium mb-2">Название проекта</h2>
          <div className="rounded-[14px] bg-[#1E1F22] overflow-hidden">
            <div className="flex items-center gap-3 px-4 py-4">
              <div className="w-12 h-12 rounded-full bg-[#3B82F6] flex items-center justify-center text-white text-xl font-medium flex-shrink-0">
                {projectLetter}
              </div>
              <span className="flex-1 text-white font-medium truncate min-w-0">
                {project.title}
              </span>
            </div>
          </div>
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

        {/* 3. Участники (организатор первым) */}
        <div className="mb-6">
          <h2 className="text-white font-medium mb-2">Участники</h2>
          <div className="rounded-[14px] bg-[#1E1F22] overflow-hidden">
            <div className="divide-y divide-[#28292D]">
              {/* Организатор (создатель задачи) — первым */}
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
              {/* Остальные участники (без организатора) */}
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
                    <button
                      key={member.user_id}
                      type="button"
                      onClick={() => toggleAssignee(member.user_id)}
                      className="flex items-center gap-3 px-4 py-3 w-full text-left"
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
                      <span
                        className={`px-3 py-1 rounded-full text-[12px] font-medium flex-shrink-0 ${
                          isSelected
                            ? "bg-[#BE87D8]/30 text-[#BE87D8]"
                            : "bg-[#28292D] text-[#9097A7]"
                        }`}
                      >
                        {role}
                      </span>
                    </button>
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

        {/* 4. Дедлайны */}
        <div className="mb-6">
          <h2 className="text-white font-medium mb-2">Дедлайны</h2>
          <div className="rounded-[14px] bg-[#1E1F22] overflow-hidden p-4">
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
                  animate={{ x: -dateOffset * 56 }}
                  transition={{
                    type: "spring",
                    stiffness: 300,
                    damping: 30,
                  }}
                  className="flex gap-2"
                  style={{ x: 0 }}
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

        {/* 5. Дополнительно (файлы) */}
        <div className="mb-8">
          <h2 className="text-white font-medium mb-2">Дополнительно</h2>
          <button
            type="button"
            onClick={handleAddFiles}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-[14px] bg-[#1E1F22] text-[#3B82F6]"
          >
            <Paperclip className="w-5 h-5 flex-shrink-0" strokeWidth={2} />
            <span className="text-[14px] font-medium">Файлы</span>
          </button>
        </div>
      </main>

      {/* 7. Кнопка добавить */}
      <div
        className="fixed bottom-0 left-0 right-0 p-[18px] z-40"
        style={{
          paddingBottom: "calc(18px + env(safe-area-inset-bottom))",
        }}
      >
        <motion.button
          type="button"
          onClick={handleSubmit}
          disabled={!taskTitle.trim() || submitting}
          className="w-full max-w-[390px] mx-auto flex items-center justify-center py-4 rounded-[14px] text-white font-medium text-[16px] disabled:opacity-50 disabled:cursor-not-allowed block"
          style={{ background: "linear-gradient(90deg, #4CAF50, #45a049)" }}
          whileTap={{ scale: 0.98 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
          {submitting ? "Создаём..." : "Добавить"}
        </motion.button>
      </div>
    </motion.div>
  );
}
