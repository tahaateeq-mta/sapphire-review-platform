import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#040b16',
        card: '#0f172a',
        primary: '#3b82f6',
        accent: '#06b6d4',
        success: '#22c55e',
        warning: '#f59e0b',
        danger: '#ef4444',
        textMain: '#f8fafc',
        textMuted: '#94a3b8',
      },
    },
  },
  plugins: [],
};
export default config;