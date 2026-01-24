import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Генерирует цвет на основе строки (названия проекта)
 * Возвращает HSL цвет для использования в CSS
 */
export function generateColorFromString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  // Генерируем hue (0-360) для ярких, насыщенных цветов
  const hue = Math.abs(hash) % 360;
  
  // Используем фиксированные saturation и lightness для консистентности
  return `hsl(${hue}, 65%, 50%)`;
}
