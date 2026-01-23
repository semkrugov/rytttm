/**
 * Get Telegram WebApp instance
 * Safe for SSR - only accesses window on client side
 * Uses window.Telegram.WebApp which is always available in Telegram Mini App
 */
function getWebApp() {
  if (typeof window === "undefined") return null;
  
  // Use window.Telegram.WebApp (always available in Telegram Mini App)
  if ((window as any).Telegram?.WebApp) {
    return (window as any).Telegram.WebApp;
  }
  
  return null;
}

/**
 * Initialize Telegram WebApp SDK
 * Call this in your root layout or main component
 */
export function initTelegram() {
  return getWebApp();
}

/**
 * Haptic feedback helpers following .cursorrules
 * Uses window.Telegram.WebApp.HapticFeedback
 * Safe for SSR - all methods check for window
 * Note: Haptic feedback only works in Telegram Mini App environment
 */
export const haptics = {
  light: () => {
    if (typeof window === "undefined") return;
    const webApp = getWebApp();
    if (webApp?.HapticFeedback) {
      try {
        webApp.HapticFeedback.impactOccurred("light");
      } catch (e) {
        // Haptic feedback not available (e.g., outside Telegram)
      }
    }
  },
  medium: () => {
    if (typeof window === "undefined") return;
    const webApp = getWebApp();
    if (webApp?.HapticFeedback) {
      try {
        webApp.HapticFeedback.impactOccurred("medium");
      } catch (e) {
        // Haptic feedback not available (e.g., outside Telegram)
      }
    }
  },
  success: () => {
    if (typeof window === "undefined") return;
    const webApp = getWebApp();
    if (webApp?.HapticFeedback) {
      try {
        webApp.HapticFeedback.notificationOccurred("success");
      } catch (e) {
        // Haptic feedback not available (e.g., outside Telegram)
      }
    }
  },
};
