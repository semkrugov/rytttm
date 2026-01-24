"use client";

import { motion } from "framer-motion";
import { animationVariants } from "@/lib/animations";
import { cn } from "@/lib/utils";

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
}

export default function ProjectsList({
  projects,
  onProjectClick,
}: ProjectsListProps) {
  return (
    <motion.div
      variants={animationVariants.staggerItem}
      initial="initial"
      animate="animate"
    >
      <h2 className="text-lg font-semibold text-[var(--tg-theme-text-color)] mb-4">
        Проекты
      </h2>
      {projects.length > 0 ? (
        <motion.div
          variants={animationVariants.staggerContainer}
          initial="initial"
          animate="animate"
          className="space-y-3"
        >
          {projects.map((project) => (
            <motion.div
              key={project.id}
              variants={animationVariants.staggerItem}
              whileTap={{ scale: 0.98 }}
              transition={{
                type: "spring",
                stiffness: 300,
                damping: 30,
              }}
              onClick={() => onProjectClick?.(project.id)}
              className="bg-[var(--tg-theme-secondary-bg-color)] rounded-xl p-4 flex items-center gap-3 cursor-pointer"
            >
              <div className="relative flex-shrink-0">
                <div
                  className={cn(
                    "w-12 h-12 rounded-full flex items-center justify-center",
                    "text-white font-semibold text-sm",
                    project.avatar
                      ? "bg-cover bg-center"
                      : "bg-[var(--tg-theme-button-color)]"
                  )}
                  style={
                    project.avatar
                      ? { backgroundImage: `url(${project.avatar})` }
                      : undefined
                  }
                >
                  {!project.avatar && project.title.charAt(0).toUpperCase()}
                </div>
                {project.active && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-500 rounded-full border-2 border-[var(--tg-theme-bg-color)]"
                  />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[var(--tg-theme-text-color)]">
                  {project.title}
                </p>
                {project.unreadCount !== undefined && project.unreadCount > 0 && (
                  <p className="text-xs text-[var(--tg-theme-hint-color)] mt-1">
                    {project.unreadCount} новых задач
                  </p>
                )}
              </div>
              {project.unreadCount !== undefined && project.unreadCount > 0 && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="flex-shrink-0 w-6 h-6 rounded-full bg-[var(--tg-theme-button-color)] flex items-center justify-center"
                >
                  <span className="text-xs font-semibold text-white">
                    {project.unreadCount > 9 ? "9+" : project.unreadCount}
                  </span>
                </motion.div>
              )}
            </motion.div>
          ))}
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.3,
            ease: [0.19, 1, 0.22, 1],
          }}
          className="bg-[var(--tg-theme-secondary-bg-color)] rounded-xl p-8 text-center"
        >
          <p className="text-sm text-[var(--tg-theme-hint-color)]">
            Ты пока не состоишь ни в одном проекте. Напиши что-нибудь в чат с ботом, чтобы проект появился здесь.
          </p>
        </motion.div>
      )}
    </motion.div>
  );
}
