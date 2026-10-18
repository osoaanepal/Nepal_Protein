/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Core Brand Navy (#000000 / Neutral Greys)
        navy: {
          50: '#F3F4F6',
          100: '#E5E7EB',
          200: '#D1D5DB',
          300: '#9CA3AF',
          400: '#6B7280',
          500: '#374151',
          600: '#1F2937',
          700: '#111827',
          800: '#0F172A',
          900: '#000000',
          950: '#000000',
        },
        // Core Brand Action Orange (#F97316)
        orange: {
          50: '#FFF7ED',
          100: '#FFEDD5',
          200: '#FED7AA',
          300: '#FDBA74',
          400: '#FB923C',
          500: '#F97316', // PRIMARY BRAND ACTION ORANGE (#F97316)
          600: '#EA580C',
          700: '#C2410C',
          800: '#9A3412',
          900: '#7C2D12',
          950: '#431407',
        },
        // Brand Semantic Tokens
        brand: {
          navy: '#000000',
          'navy-dark': '#000000',
          'navy-light': '#1F2937',
          'navy-subtle': '#E5E7EB',
          orange: '#F97316',
          'orange-hover': '#EA580C',
          'orange-dark': '#C2410C',
          'orange-light': '#FB923C',
          'orange-subtle': '#FFF7ED',
        },
        surface: {
          white: '#FFFFFF',
          ground: '#FAFAFB',
          subtle: '#F8FAFC',
          muted: '#F1F5F9',
          border: '#E2E8F0',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Outfit', 'Inter', 'sans-serif'],
      },
      boxShadow: {
        'brand': '0 4px 20px -2px rgba(0, 0, 0, 0.08)',
        'brand-lg': '0 10px 30px -4px rgba(0, 0, 0, 0.12)',
        'orange-sm': '0 2px 10px rgba(249, 115, 22, 0.20)',
        'orange-md': '0 4px 18px rgba(249, 115, 22, 0.28)',
      }
    },
  },
  plugins: [],
}
