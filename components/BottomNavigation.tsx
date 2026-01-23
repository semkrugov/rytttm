"use client";

import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, CheckSquare, Inbox, User } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { haptics } from "@/lib/telegram";

interface Tab {
  id: string;
  label: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
}

const tabs: Tab[] = [
  { id: "widget", label: "Виджет", path: "/", icon: LayoutDashboard },
  { id: "tasks", label: "Задачи", path: "/tasks", icon: CheckSquare },
  { id: "inbox", label: "AI-Инбокс", path: "/ai-inbox", icon: Inbox },
  { id: "profile", label: "Профиль", path: "/profile", icon: User },
];

export default function BottomNavigation() {
  const pathname = usePathname();
  const router = useRouter();

  const handleTabClick = (path: string) => {
    if (typeof window !== "undefined") {
      haptics.light();
    }
    router.push(path);
  };

  const getActiveTab = () => {
    if (pathname === "/") return "widget";
    return tabs.find((tab) => tab.path === pathname)?.id || "widget";
  };

  const activeTab = getActiveTab();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50"
      style={{
        paddingBottom: "env(safe-area-inset-bottom)",
        backdropFilter: "blur(20px) saturate(180%)",
        WebkitBackdropFilter: "blur(20px) saturate(180%)",
        backgroundColor: "var(--tg-nav-bg-color, rgba(255, 255, 255, 0.85))",
        borderTop: "1px solid var(--tg-nav-border-color, rgba(0, 0, 0, 0.05))",
      }}
    >
      <div className="flex items-center justify-around h-16 px-4">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <motion.button
              key={tab.id}
              onClick={() => handleTabClick(tab.path)}
              className={cn(
                "relative flex flex-col items-center justify-center gap-1 flex-1 h-full",
                "transition-colors duration-200",
                isActive
                  ? "text-[var(--tg-theme-button-color)]"
                  : "text-[var(--tg-theme-hint-color)]"
              )}
              whileTap={{ scale: 0.95 }}
              transition={{
                type: "spring",
                stiffness: 300,
                damping: 30,
              }}
            >
              <Icon className="w-5 h-5" />
              <span className="text-xs font-medium">{tab.label}</span>
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-[var(--tg-theme-button-color)] rounded-full"
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
      </div>
    </nav>
  );
}
