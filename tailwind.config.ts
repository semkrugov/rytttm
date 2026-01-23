import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      transitionTimingFunction: {
        "ease-out-expo": "cubic-bezier(0.19, 1, 0.22, 1)",
        "ease-out-quart": "cubic-bezier(0.165, 0.84, 0.44, 1)",
        "ease-in-out-quint": "cubic-bezier(0.86, 0, 0.07, 1)",
      },
    },
  },
  plugins: [],
};
export default config;
