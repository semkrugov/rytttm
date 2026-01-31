"use client";

import { motion } from "framer-motion";
import { animationVariants } from "@/lib/animations";
import { cn } from "@/lib/utils";
import { useHasAnimated } from "@/hooks/useHasAnimated";

export interface Project {
  id: string;
  title: string;
  avatar?: string;
  active?: boolean;
  unreadCount?: number;
}

interface ProjectsListProps {
  projects: Project[];
  onProjectClick?: (projectId: string) => void;
  /**
   * Скрывает заголовок "Проекты", если он уже отображается снаружи.
   */
  hideHeader?: boolean;
  className?: string;
}

export default function ProjectsList({
  projects,
  onProjectClick,
  hideHeader,
  className,
}: ProjectsListProps) {
  const hasAnimated = useHasAnimated();
  
  return (
    <motion.div
      variants={hasAnimated ? undefined : animationVariants.staggerItem}
      initial={hasAnimated ? false : "initial"}
      animate="animate"
      className={className}
    >
      {!hideHeader && (
        <h2 className="text-lg font-semibold text-[var(--tg-theme-text-color)] mb-4">
          Проекты
        </h2>
      )}
      {projects.length > 0 ? (
        <motion.div
          variants={hasAnimated ? undefined : animationVariants.staggerContainer}
          initial={hasAnimated ? false : "initial"}
          animate={hasAnimated ? false : "animate"}
          className="flex flex-col"
        >
          {projects.map((project, index) => (
            <motion.div
              key={project.id}
              variants={hasAnimated ? undefined : animationVariants.staggerItem}
              initial={hasAnimated ? false : { opacity: 0 }}
              animate={hasAnimated ? false : { opacity: 1 }}
              whileTap={{ scale: 0.98 }}
              transition={hasAnimated ? { duration: 0 } : {
                type: "spring",
                stiffness: 300,
                damping: 30,
              }}
              onClick={() => onProjectClick?.(project.id)}
              className={cn(
                "flex items-center gap-3 px-[18px] py-[18px]",
                index !== projects.length - 1 && "border-b border-[#28292D]",
                "cursor-pointer"
              )}
            >
            <div className="relative flex-shrink-0">
              <div
                className={cn(
                  "w-[60px] h-[60px] rounded-full flex items-center justify-center",
                  "text-white font-bold text-xl",
                  project.avatar
                    ? "bg-cover bg-center"
                    : "bg-gradient-to-b from-[#9BE1FF] to-[#6CC2FF]"
                )}
                style={
                  project.avatar
                    ? { backgroundImage: `url(${project.avatar})` }
                    : undefined
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
            {project.unreadCount !== undefined && project.unreadCount > 0 && (
              <div className="flex-shrink-0 w-[24px] h-[24px] rounded-full bg-[#6CC2FF] flex items-center justify-center">
                <span className="text-[12px] font-bold text-white">
                  {project.unreadCount}
                </span>
              </div>
            )}
          </motion.div>
          ))}
        </motion.div>
      ) : (
        <div className="rounded-xl p-8 text-center bg-[#1E1F22]">
          <p className="text-sm text-[#9097A7]">
            Ты пока не состоишь ни в одном проекте. Напиши что-нибудь в чат с ботом, чтобы проект появился здесь.
          </p>
        </div>
      )}
    </motion.div>
  );
}
