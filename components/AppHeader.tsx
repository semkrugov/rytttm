"use client";

import { ReactNode } from "react";

interface AppHeaderProps {
  /** Слот слева (например кнопка «Назад») */
  leftSlot?: ReactNode;
  /** Слот справа */
  rightSlot?: ReactNode;
  /** Заголовок по центру (если передан, заменяет логотип) */
  title?: string;
}

export default function AppHeader({ leftSlot, rightSlot, title }: AppHeaderProps) {
  return (
    <div className="h-[70px] flex items-center justify-center gap-0 px-[18px] py-0">
      <div className="w-10 h-10 shrink-0 flex items-center justify-center">
        {leftSlot ?? (
          <div className="w-10 h-10 rounded-full bg-[var(--tg-theme-secondary-bg-color)]/80" />
        )}
      </div>
      <div className="flex-1 flex items-center justify-center min-w-0">
        {title ? (
          <span className="text-[17px] font-bold text-white tracking-wide truncate">
            {title}
          </span>
        ) : (
          <img
            src="/assets/logo.svg"
            alt="rytttm"
            className="h-[27px] w-auto object-contain"
          />
        )}
      </div>
      <div className="w-10 h-10 shrink-0 flex items-center justify-center">
        {rightSlot ?? (
          <div className="w-10 h-10 rounded-full bg-[var(--tg-theme-secondary-bg-color)]/80" />
        )}
      </div>
    </div>
  );
}
