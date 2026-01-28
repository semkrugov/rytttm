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
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        handleClick();
      }}
      disabled={disabled}
      className={cn(
        "w-[25px] h-[25px] rounded-lg border-[3px] flex items-center justify-center relative z-20",
        "transition-colors duration-200",
        checked
          ? "bg-[#6CC2FF] border-[#6CC2FF]"
          : "border-[#9097A7] bg-transparent",
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
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{
            duration: 0.2,
            ease: [0.19, 1, 0.22, 1],
          }}
        >
          <Check className="w-[14px] h-[14px] text-white" strokeWidth={4} />
        </motion.div>
      )}
    </motion.button>
  );
}
