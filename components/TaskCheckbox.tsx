"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { haptics } from "@/lib/telegram";
import { cn } from "@/lib/utils";

interface TaskCheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

export default function TaskCheckbox({
  checked,
  onChange,
  disabled = false,
}: TaskCheckboxProps) {
  const handleClick = () => {
    if (!disabled) {
      haptics.light();
      onChange(!checked);
    }
  };

  return (
    <motion.button
      onClick={handleClick}
      disabled={disabled}
      className={cn(
        "w-6 h-6 rounded-lg border-2 flex items-center justify-center",
        "transition-colors duration-200",
        checked
          ? "bg-[var(--tg-theme-button-color)] border-[var(--tg-theme-button-color)]"
          : "border-[var(--tg-theme-hint-color)]/30 bg-transparent",
        disabled && "opacity-50 cursor-not-allowed"
      )}
      whileTap={{ scale: 0.9 }}
      transition={{
        type: "spring",
        stiffness: 400,
        damping: 25,
      }}
    >
      {checked && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{
            duration: 0.2,
            ease: [0.19, 1, 0.22, 1],
          }}
        >
          <Check className="w-4 h-4 text-white" strokeWidth={3} />
        </motion.div>
      )}
    </motion.button>
  );
}
