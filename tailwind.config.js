/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
      padding: "1.5rem",
    },
    extend: {
      colors: {
        primary: {
          DEFAULT: "#4F46E5",
          light: "#6366F1",
          dark: "#4338CA",
        },
        gradient: {
          start: "#4F46E5",
          end: "#7C3AED",
        },
        success: "#10B981",
        warning: "#F59E0B",
        danger: "#EF4444",
        info: "#3B82F6",
        ai: {
          DEFAULT: "#6D28D9",
          purple: "#6D28D9",
        },
        surface: {
          primary: "#F8FAFC",
          card: "#FFFFFF",
          border: "#E2E8F0",
        },
        text: {
          primary: "#1E293B",
          secondary: "#64748B",
          muted: "#94A3B8",
        },
        dark: {
          bg: "#0F172A",
          card: "#1E293B",
          border: "#334155",
          text: "#F1F5F9",
        },
      },
      borderRadius: {
        sm: "8px",
        md: "12px",
        lg: "16px",
      },
      boxShadow: {
        custom: {
          sm: "0 1px 3px rgba(0,0,0,0.06)",
          md: "0 4px 12px rgba(0,0,0,0.08)",
          lg: "0 8px 30px rgba(0,0,0,0.12)",
          glow: "0 0 20px rgba(79,70,229,0.15)",
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      fontSize: {
        "body-base": "16px",
      },
      transitionTimingFunction: {
        "base": "cubic-bezier(0.4,0,0.2,1)",
      },
      keyframes: {
        "pulse-dot": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.4" },
        },
        "slide-up": {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "breathe": {
          "0%, 100%": { opacity: "0.6" },
          "50%": { opacity: "1" },
        },
        "scale-in": {
          "0%": { transform: "scale(0.95)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        "shimmer": {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
      animation: {
        "pulse-dot": "pulse-dot 2s ease-in-out infinite",
        "slide-up": "slide-up 0.2s ease-out",
        "breathe": "breathe 2s ease-in-out infinite",
        "scale-in": "scale-in 0.2s ease-out",
        "shimmer": "shimmer 1.5s infinite",
      },
    },
  },
  plugins: [],
};