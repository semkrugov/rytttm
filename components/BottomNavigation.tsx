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
