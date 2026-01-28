"use client";

import { cn } from "@/lib/utils";

interface AttentionCardProps {
  title: string;
  message: string;
  time?: string;
  addLabel?: string;
  className?: string;
}

export default function AttentionCard({
  title,
  message,
  time,
  addLabel,
  className,
}: AttentionCardProps) {
  return (
    <div
      className={cn(
        "relative flex w-full flex-col overflow-hidden rounded-[20px] p-5",
        "bg-gradient-to-b from-[#232427] to-[#151617]",
        "ring-1 ring-white/[0.08]",
        className
      )}
    >
      <div className="flex items-start gap-4">
        {/* Иконка колокольчика */}
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/5">
          <img src="/assets/attention-bell.svg" alt="" className="h-5 w-5 object-contain" />
        </div>

        {/* Контент */}
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <div className="flex items-center justify-between gap-2">
            <h4 className="text-[17px] font-semibold text-white">{title}</h4>
          </div>
          <p className="text-[15px] leading-relaxed text-[#B0B0B0] line-clamp-2">
            {message}
          </p>
          
          <div className="mt-2 flex items-center justify-between">
            {time && <span className="text-[13px] text-[#707579]">{time}</span>}
          </div>
        </div>
      </div>

      {/* Правая верхняя иконка */}
      <div className="absolute right-3 top-3 opacity-80">
        <img src="/assets/attention-comment.svg" alt="" className="h-9 w-9" />
      </div>

      {/* Счетчик снизу справа */}
      {addLabel && (
        <span className="absolute bottom-5 right-5 text-[13px] font-medium text-[#6CC2FF]">
          {addLabel}
        </span>
      )}
    </div>
  );
}
