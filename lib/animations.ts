/**
 * Animation configurations following .cursorrules
 * These are reusable animation variants for Framer Motion
 */

export const animationVariants = {
  // Easing functions from .cursorrules
  easing: {
    "ease-out-expo": [0.19, 1, 0.22, 1] as [number, number, number, number],
    "ease-out-quart": [0.165, 0.84, 0.44, 1] as [number, number, number, number],
    "ease-in-out-quint": [0.86, 0, 0.07, 1] as [number, number, number, number],
  },

  // Spring configuration for natural feel
  spring: {
    type: "spring" as const,
    stiffness: 300,
    damping: 30,
  },

  // Fast UI transitions (200ms-400ms)
  duration: {
    fast: 0.2,
    medium: 0.3,
    normal: 0.4,
  },

  // Fade in with transform
  fadeIn: {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -10 },
  },

  // Stagger container for lists
  staggerContainer: {
    initial: {},
    animate: {
      transition: {
        staggerChildren: 0.05,
      },
    },
  },

  // Stagger item
  staggerItem: {
    initial: { opacity: 0, y: 20 },
    animate: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.3,
        ease: [0.19, 1, 0.22, 1],
      },
    },
  },
};
