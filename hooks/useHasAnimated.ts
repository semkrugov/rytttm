import { useState, useEffect } from "react";

/**
 * Хук для проверки, была ли уже проиграна анимация в этой сессии
 * Анимации проигрываются только один раз при первом входе в приложение
 * После первого проигрывания все элементы отображаются статично
 */
export function useHasAnimated(): boolean {
  const [hasAnimated, setHasAnimated] = useState(() => {
    if (typeof window === "undefined") return true; // SSR - не анимируем
    // Проверяем sessionStorage при инициализации
    return sessionStorage.getItem("app_has_animated") === "true";
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    
    // Если анимация еще не была проиграна, устанавливаем флаг после первого рендера
    if (!hasAnimated) {
      // Небольшая задержка, чтобы анимация успела начаться
      const timer = setTimeout(() => {
        sessionStorage.setItem("app_has_animated", "true");
        setHasAnimated(true);
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [hasAnimated]);

  return hasAnimated;
}
