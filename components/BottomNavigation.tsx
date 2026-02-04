"use client";

import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, CheckSquare, FolderOpen, User } from "lucide-react";
import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";
import { haptics } from "@/lib/telegram";

interface Tab {
  id: string;
  labelKey: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
}

const tabs: Tab[] = [
  { id: "widget", labelKey: "nav.widget", path: "/", icon: LayoutDashboard },
  { id: "tasks", labelKey: "nav.tasks", path: "/tasks", icon: CheckSquare },
  { id: "projects", labelKey: "nav.projects", path: "/projects", icon: FolderOpen },
  { id: "profile", labelKey: "nav.profile", path: "/profile", icon: User },
];

export default function BottomNavigation() {
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useLanguage();

  const handleTabClick = (path: string) => {
    if (typeof window !== "undefined") {
      haptics.light();
    }
    router.push(path);
  };

  const getActiveTab = () => {
    if (pathname === "/") return "widget";
    if (pathname.startsWith("/tasks")) return "tasks";
    if (pathname.startsWith("/projects")) return "projects";
    if (pathname.startsWith("/profile")) return "profile";
    return tabs.find((tab) => tab.path === pathname)?.id || "widget";
  };

  const activeTab = getActiveTab();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 pointer-events-none"
      style={{
        paddingBottom: "calc(10px + env(safe-area-inset-bottom))",
        backdropFilter: "blur(20px) saturate(180%)",
        WebkitBackdropFilter: "blur(20px) saturate(180%)",
      }}
    >
      <div className="flex items-center justify-center h-16 px-4">
        <motion.div
          className="pointer-events-auto flex items-center justify-between max-w-[370px] w-full h-[60px] rounded-full px-2"
          style={{
            backgroundImage:
              "linear-gradient(90deg, #C3CBFF 0%, #F6B3FF 100%)",
          }}
          initial={false}
        >
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <motion.button
                key={tab.id}
                onClick={() => handleTabClick(tab.path)}
                className={cn(
                  "relative flex-1 h-full flex items-center justify-center"
                )}
                whileTap={{ scale: 0.98 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeTabPill"
                    className="absolute inset-y-1 left-1 right-1 rounded-full bg-white"
                    initial={false}
                    transition={{
                      type: "spring",
                      stiffness: 300,
                      damping: 30,
                    }}
                  />
                )}
                <Icon
                  className={cn(
                    "w-5 h-5 relative z-10",
                    isActive ? "text-[#101217]" : "text-white"
                  )}
                />
              </motion.button>
            );
          })}
        </motion.div>
      </div>
    </nav>
  );
}
