/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class', 

  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#FF6B35',
          light: '#FED7AA',
        },
        text: {
          primary: '#1E293B',
          secondary: '#64748B',
        },
        background: {
          light: '#F8FAFC',
          DEFAULT: '#FFFFFF',
        },
        status: {
          success: '#10B981',
          error: '#EF4444',
        },
        // The dark theme colors can remain here but won't be used
        dark: {
          primary: {
            DEFAULT: '#FF7A45',
            light: '#4A2B1B',
          },
          text: {
            primary: '#F1F5F9',
            secondary: '#94A3B8',
          },
          background: {
            light: '#1E293B',
            DEFAULT: '#0F172A',
          },
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [
    require('@tailwindcss/vite')
  ],
}