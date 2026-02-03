import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
          muted: "hsl(var(--sidebar-muted))",
        },
        // Status colors for PMS
        success: {
          DEFAULT: "hsl(var(--success))",
          foreground: "hsl(var(--success-foreground))",
        },
        warning: {
          DEFAULT: "hsl(var(--warning))",
          foreground: "hsl(var(--warning-foreground))",
        },
        info: {
          DEFAULT: "hsl(var(--info))",
          foreground: "hsl(var(--info-foreground))",
        },
        // Room status colors
        room: {
          vacant: "hsl(var(--room-vacant))",
          occupied: "hsl(var(--room-occupied))",
          dirty: "hsl(var(--room-dirty))",
          maintenance: "hsl(var(--room-maintenance))",
          "out-of-order": "hsl(var(--room-out-of-order))",
        },
        // Vibrant colors for gradients and accents
        vibrant: {
          blue: "hsl(var(--vibrant-blue))",
          purple: "hsl(var(--vibrant-purple))",
          green: "hsl(var(--vibrant-green))",
          amber: "hsl(var(--vibrant-amber))",
          rose: "hsl(var(--vibrant-rose))",
          cyan: "hsl(var(--vibrant-cyan))",
          indigo: "hsl(var(--vibrant-indigo))",
          pink: "hsl(var(--vibrant-pink))",
          orange: "hsl(var(--vibrant-orange))",
          teal: "hsl(var(--vibrant-teal))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        xl: "calc(var(--radius) + 4px)",
        "2xl": "calc(var(--radius) + 8px)",
      },
      boxShadow: {
        vibrant: "0 4px 14px 0 hsl(var(--primary) / 0.25)",
        "vibrant-lg": "0 10px 25px -3px hsl(var(--primary) / 0.3)",
        glow: "0 0 20px hsl(var(--primary) / 0.3)",
      },
      backgroundImage: {
        "gradient-primary": "linear-gradient(135deg, hsl(var(--vibrant-blue)) 0%, hsl(var(--vibrant-purple)) 100%)",
        "gradient-success": "linear-gradient(135deg, hsl(var(--vibrant-green)) 0%, hsl(var(--vibrant-teal)) 100%)",
        "gradient-warning": "linear-gradient(135deg, hsl(var(--vibrant-amber)) 0%, hsl(var(--vibrant-orange)) 100%)",
        "gradient-danger": "linear-gradient(135deg, hsl(var(--vibrant-rose)) 0%, hsl(var(--vibrant-pink)) 100%)",
        "gradient-info": "linear-gradient(135deg, hsl(var(--vibrant-cyan)) 0%, hsl(var(--vibrant-blue)) 100%)",
        "gradient-purple": "linear-gradient(135deg, hsl(var(--vibrant-purple)) 0%, hsl(var(--vibrant-pink)) 100%)",
        "gradient-indigo": "linear-gradient(135deg, hsl(var(--vibrant-indigo)) 0%, hsl(var(--vibrant-purple)) 100%)",
        "gradient-radial": "radial-gradient(circle at top right, var(--tw-gradient-stops))",
      },
      keyframes: {
        "accordion-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0",
          },
        },
        "fade-in": {
          from: { opacity: "0", transform: "translateY(10px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in-up": {
          from: { opacity: "0", transform: "translateY(20px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "slide-in-right": {
          from: { transform: "translateX(100%)" },
          to: { transform: "translateX(0)" },
        },
        "scale-in": {
          from: { opacity: "0", transform: "scale(0.95)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
        "count-up": {
          from: { opacity: "0", transform: "translateY(10px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-5px)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.3s ease-out",
        "fade-in-up": "fade-in-up 0.4s ease-out",
        "slide-in-right": "slide-in-right 0.3s ease-out",
        "scale-in": "scale-in 0.2s ease-out",
        "count-up": "count-up 0.5s ease-out",
        float: "float 3s ease-in-out infinite",
      },
      fontSize: {
        "2xs": ["0.625rem", { lineHeight: "0.875rem" }],
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
