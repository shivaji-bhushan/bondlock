/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        mulberry: {
          950: '#0A020E',
          900: '#120317', // Deep velvet mulberry background
          850: '#1A0622',
          800: '#230B2E', // Velvet card surface
          750: '#2C0F3A',
          700: '#3D1550',
          600: '#561E72',
        },
        neonPink: {
          400: '#FF4D9D',
          500: '#FF2E93', // Vibrant neon hot magenta from reference
          600: '#E11D74',
          700: '#BE125A',
        },
        electricViolet: {
          400: '#C084FC',
          500: '#A855F7',
          600: '#9333EA',
        },
        rosegold: {
          300: '#F5DCBF',
          400: '#E0A96D',
          500: '#D4924B',
        },
        emeraldGlow: {
          DEFAULT: '#4ECCA3',
          dark: '#2EB872',
          light: '#72DEC2',
        },
        panicRed: {
          DEFAULT: '#FF4B72',
          dark: '#E02650',
        },
      },
      fontFamily: {
        serif: ['Cormorant Garamond', 'Playfair Display', 'Georgia', 'serif'],
        sans: ['Plus Jakarta Sans', 'Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      boxShadow: {
        'pink-glow': '0 0 35px -5px rgba(255, 46, 147, 0.45)',
        'pink-subtle': '0 0 20px 0 rgba(255, 46, 147, 0.25)',
        'violet-glow': '0 0 35px -5px rgba(168, 85, 247, 0.45)',
        'velvet-card': '0 20px 40px -15px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(255, 46, 147, 0.15)',
        'phone-frame': '0 25px 70px -15px rgba(225, 29, 116, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.1)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow': 'spin 12s linear infinite',
      },
    },
  },
  plugins: [],
}
