import { useState } from "react";

/**
 * Хук для проверки, была ли уже проиграна анимация в этой сессии
 * Анимации проигрываются только один раз при первом входе в приложение
 */
export function useHasAnimated(): boolean {
  const [hasAnimated] = useState(() => {
    if (typeof window === "undefined") return true; // SSR - не анимируем
    const animated = sessionStorage.getItem("app_has_animated");
    if (!animated) {
      sessionStorage.setItem("app_has_animated", "true");
      return false; // Первый раз - анимируем
    }
    return true; // Уже анимировали - не анимируем
  });

  return hasAnimated;
}
