 "use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Search, MessageCircle } from "lucide-react";
import AppHeader from "@/components/AppHeader";
import BottomNavigation from "@/components/BottomNavigation";
import { Project } from "@/types";
import { supabase } from "@/lib/supabase";
import { haptics } from "@/lib/telegram";
import { useTelegramAuth } from "@/hooks/useTelegramAuth";
import { cn } from "@/lib/utils";

const ARCHIVE_REVEAL = 72;
const SWIPE_THRESHOLD = 48;

const demoProjects: Project[] = [
  {
    id: "demo-work",
    title: "Team_chat_project78",
    active: true,
    unreadCount: 3,
    archived: false,
  },
  {
    id: "demo-life",
    title: "Личные дела",
    active: true,
    unreadCount: 1,
    archived: false,
  },
];

type ProjectsTab = "all" | "archive";

function ProjectCardSwipe({
  project,
  isLast,
  onOpen,
  onArchive,
}: {
  project: Project;
  isLast: boolean;
  onOpen: () => void;
  onArchive: () => void;
}) {
  const [didDrag, setDidDrag] = useState(false);

  const handleDragStart = () => {
    setDidDrag(false);
  };

  const handleDragEnd = (_: unknown, info: { offset: { x: number }; velocity: { x: number } }) => {
    if (Math.abs(info.offset.x) > 5 || Math.abs(info.velocity.x) > 50) {
      setDidDrag(true);
    }
    if (info.offset.x < -SWIPE_THRESHOLD || info.velocity.x < -100) {
      haptics.medium();
      onArchive();
    }
  };

  const handleTap = () => {
    if (!didDrag) {
      haptics.light();
      onOpen();
    }
  };

  return (
    <div className={cn("relative overflow-hidden", !isLast && "border-b border-[#28292D]")}>
      {/* Карточка (свайпаемая влево — архив по порогу) */}
      <motion.div
        drag="x"
        dragConstraints={{ left: -ARCHIVE_REVEAL, right: 0 }}
        dragElastic={0.15}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onTap={handleTap}
        className="relative flex items-center gap-3 px-[18px] py-[18px] bg-[#1E1F22] cursor-grab active:cursor-grabbing touch-pan-y"
        whileTap={{ scale: 0.998 }}
      >
        <div className="relative flex-shrink-0">
          <div
            className={cn(
              "w-[60px] h-[60px] rounded-full flex items-center justify-center text-white font-bold text-xl",
              project.avatar ? "bg-cover bg-center" : "bg-gradient-to-b from-[#9BE1FF] to-[#6CC2FF]"
            )}
            style={
              project.avatar ? { backgroundImage: `url(${project.avatar})` } : undefined
            }
          >
            {!project.avatar && project.title.charAt(0).toUpperCase()}
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[16px] font-normal text-white truncate">
            {project.title}
          </p>
        </div>
        {project.unreadCount !== undefined && project.unreadCount > 0 ? (
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-[#6CC2FF]/20 flex items-center justify-center">
            <MessageCircle className="w-5 h-5 text-[#6CC2FF]" strokeWidth={2} />
          </div>
        ) : (
          <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center opacity-50">
            <MessageCircle className="w-5 h-5 text-[#9097A7]" strokeWidth={2} />
          </div>
        )}
      </motion.div>
    </div>
  );
}

let cachedProjects: Project[] | null = null;

export default function ProjectsPage() {
  const router = useRouter();
  const { user, loading: authLoading, isDemoMode } = useTelegramAuth();
  const [projects, setProjects] = useState<Project[]>(cachedProjects || []);
  const [archivedIds, setArchivedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(!cachedProjects);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<ProjectsTab>("all");

  useEffect(() => {
    if (authLoading) return;
    if (user) {
      loadProjects(Boolean(cachedProjects));
    } else {
      setProjects(demoProjects);
      setLoading(false);
    }
  }, [authLoading, user?.id]);

  const loadProjects = async (silent: boolean) => {
    if (!user?.id) return;
    try {
      if (!silent) {
        setLoading(true);
      }
      const { data, error } = await supabase
        .from("project_members")
        .select("project_id, projects(id, title)")
        .eq("user_id", user.id);

      if (error) throw error;

      const list: Project[] = (data || []).flatMap((pm: any) => {
        const proj = Array.isArray(pm.projects) ? pm.projects[0] : pm.projects;
        if (!proj) return [];
        return [{
          id: proj.id,
          title: proj.title,
          active: true,
          unreadCount: 0,
          archived: false
        }];
      });

      cachedProjects = list;
      setProjects(list);
    } catch (e) {
      console.error("Error loading projects:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleProjectClick = (projectId: string) => {
    router.push(`/projects/${projectId}`);
  };

  const handleArchiveToggle = (projectId: string) => {
    setArchivedIds((prev) => {
      const next = new Set(prev);
      if (next.has(projectId)) next.delete(projectId);
      else next.add(projectId);
      return next;
    });
    // TODO: в проде — обновить проект в Supabase (archived: true/false)
  };

  const handleAddProject = () => {
    haptics.medium();
    // TODO: открыть создание проекта или модал
  };

  const handleTabClick = (tab: ProjectsTab) => {
    haptics.light();
    setActiveTab(tab);
  };

  const showSkeleton = authLoading || (loading && !isDemoMode);

  const q = searchQuery.trim().toLowerCase();
  const filteredBySearch = projects.filter(
    (p) => !q || p.title.toLowerCase().includes(q)
  );
  const activeProjects = filteredBySearch.filter((p) => !archivedIds.has(p.id));
  const archivedProjects = filteredBySearch.filter((p) => archivedIds.has(p.id));
  const displayProjects = activeTab === "all" ? activeProjects : archivedProjects;

  return (
    <div className="min-h-screen bg-[rgba(35,36,39,1)]">
      <main
        className="mx-auto max-w-[390px] py-4 pb-24"
        style={{
          paddingBottom: "calc(6rem + env(safe-area-inset-bottom))",
        }}
      >
        <motion.div
          initial={false}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, ease: [0.19, 1, 0.22, 1] }}
          className="flex flex-col gap-4 px-[18px]"
        >
          <AppHeader />
          <h1 className="text-[22px] font-medium text-white">
            Проекты
          </h1>

          {/* Строка поиска */}
          <div className="flex items-center gap-3 h-12 px-4 rounded-[14px] bg-[#1E1F22]">
            <Search className="w-5 h-5 text-[#9097A7] flex-shrink-0" strokeWidth={2} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Поиск"
              className="flex-1 min-w-0 bg-transparent text-white text-[16px] placeholder:text-[#9097A7] outline-none"
            />
          </div>

          {/* Табы Все / Архив */}
          <div className="flex w-full h-11 rounded-[10px] p-[3px] relative bg-[#1E1F22]">
            {(["all", "archive"] as const).map((tab) => {
              const isActive = activeTab === tab;
              const label = tab === "all" ? "Все" : "Архив";
              return (
                <motion.button
                  key={tab}
                  type="button"
                  onClick={() => handleTabClick(tab)}
                  className={cn(
                    "relative flex-1 h-full rounded-[8px] text-[14px] font-medium transition-colors z-10",
                    isActive ? "text-white" : "text-[#9097A7]"
                  )}
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                >
                  {label}
                  {isActive && (
                    <motion.div
                      layoutId="activeProjectsTab"
                      className="absolute inset-0 rounded-[8px] -z-10"
                      style={{
                        background: "linear-gradient(90deg, #C3CBFF 0%, #F6B3FF 100%)",
                      }}
                      initial={false}
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}
                </motion.button>
              );
            })}
          </div>

          {/* Список проектов */}
          <AnimatePresence mode="wait">
            {showSkeleton ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col rounded-[14px] overflow-hidden bg-[#1E1F22]"
              >
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className={cn(
                      "flex items-center gap-3 px-[18px] py-[18px] animate-pulse",
                      i < 3 && "border-b border-[#28292D]"
                    )}
                  >
                    <div className="w-[60px] h-[60px] rounded-full bg-[#28292D]" />
                    <div className="flex-1 min-w-0">
                      <div className="h-4 bg-[#28292D] rounded w-3/4" />
                    </div>
                  </div>
                ))}
              </motion.div>
            ) : (
              <motion.div
                key="content"
                initial={false}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3, ease: [0.19, 1, 0.22, 1] }}
                className="rounded-[14px] overflow-hidden bg-[#1E1F22]"
              >
                {displayProjects.length > 0 ? (
                  <div className="flex flex-col">
                    {displayProjects.map((project, index) => (
                      <ProjectCardSwipe
                        key={project.id}
                        project={project}
                        isLast={index === displayProjects.length - 1}
                        onOpen={() => handleProjectClick(project.id)}
                        onArchive={() => handleArchiveToggle(project.id)}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="rounded-xl p-8 text-center">
                    <p className="text-sm text-[#9097A7]">
                      {activeTab === "archive"
                        ? "Нет архивных проектов"
                        : searchQuery.trim()
                          ? "Ничего не найдено"
                          : "Ты пока не состоишь ни в одном проекте. Напиши что-нибудь в чат с ботом, чтобы проект появился здесь."}
                    </p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        <motion.button
          onClick={handleAddProject}
          className="fixed bottom-24 right-[18px] w-14 h-14 rounded-full flex items-center justify-center shadow-lg z-40"
          style={{
            background: "linear-gradient(90deg, #C3CBFF 0%, #F6B3FF 100%)",
            bottom: "calc(6rem + env(safe-area-inset-bottom))",
          }}
          whileTap={{ scale: 0.9 }}
          transition={{
            type: "spring",
            stiffness: 300,
            damping: 30,
          }}
        >
          <Plus className="w-6 h-6 text-white" strokeWidth={3} />
        </motion.button>
      </main>

      <BottomNavigation />
    </div>
  );
}
