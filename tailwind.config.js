/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        'sans': ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
        'cursive': ['Dancing Script', 'cursive'],
        'comic': ['Comic Neue', 'cursive'],
        'beast': ['Bangers', 'cursive'],
      },
      colors: {
        dark: {
          bg: '#121212',
          surface: '#1e1e1e',
          border: '#333333',
          text: '#f3f4f6',
          muted: '#9ca3af',
          primary: '#3b82f6',
        },
        medical: {
          lightPrimary: '#5a9bd5',
          lightSecondary: '#7ccfae',
          lightAccent: '#b38cc4',
          lightBackground: '#f5f8fc',
          lightSurface: '#ffffff',
          lightBorder: '#e2eaf2',
          lightText: '#334155',
          lightMuted: '#94a3b8',
          darkPrimary: '#4981b3',
          darkSecondary: '#5db495',
          darkAccent: '#9670ab',
          darkBackground: '#1a202c',
          darkSurface: '#252d3b',
          darkBorder: '#3a4458',
          darkText: '#e2e8f0',
          darkMuted: '#8595ad',
        }
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulse: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.8' },
        },
        bounce: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        gradientFire: {
          '0%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
          '100%': { backgroundPosition: '0% 50%' },
        }
      },
      animation: {
        fadeIn: 'fadeIn 0.5s ease-out forwards',
        pulse: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        bounce: 'bounce 1s ease-in-out infinite',
        'gradient-fire': 'gradientFire 3s ease infinite',
      },
      dropShadow: {
        'glow': '0 0 3px rgba(255, 165, 0, 0.5)',
      },
      typography: {
        DEFAULT: {
          css: {
            maxWidth: 'none',
            color: '#374151',
            h3: {
              color: '#1e40af',
            },
            strong: {
              color: '#111827',
              fontWeight: '600',
            },
            a: {
              color: '#3b82f6',
              '&:hover': {
                color: '#2563eb',
              },
            },
          },
        },
        dark: {
          css: {
            color: '#d1d5db',
            h3: {
              color: '#60a5fa',
            },
            strong: {
              color: '#f3f4f6',
              fontWeight: '600',
            },
            a: {
              color: '#3b82f6',
              '&:hover': {
                color: '#60a5fa',
              },
            },
          },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
} 