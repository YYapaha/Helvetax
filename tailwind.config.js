/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      colors: {
        // Warm cream backgrounds — palette Claude
        sand: {
          50:  '#FDFCFA',
          100: '#FAF9F7',  // main bg
          200: '#F5F2ED',  // sidebar bg
          300: '#EDE8DF',  // hover states
          400: '#DDD8CF',  // borders
          500: '#C8C1B5',  // muted borders
          600: '#9E9589',  // secondary text
          700: '#6B6461',  // body text
          800: '#3D3936',  // heading text
          900: '#1F1D1B',  // primary text
        },
        // Terracotta accent — Claude's warm coral
        terra: {
          50:  '#FDF3EF',
          100: '#FAE4DB',
          200: '#F4C5B0',
          300: '#EBA07E',
          400: '#DF7B52',
          500: '#C96442',  // main accent
          600: '#B0522F',
          700: '#8F4026',
          800: '#6D3020',
          900: '#4E2217',
        },
        // Keep 'primary' as alias for terra for backward compat
        primary: {
          50:  '#FDF3EF',
          100: '#FAE4DB',
          200: '#F4C5B0',
          300: '#EBA07E',
          400: '#DF7B52',
          500: '#C96442',
          600: '#B0522F',
          700: '#8F4026',
          800: '#6D3020',
          900: '#4E2217',
        },
        // Semantic colors (warm-tinted)
        success: '#2E9E6B',
        warning: '#C9830A',
        danger:  '#C94242',
      },
      borderRadius: {
        'xl':  '12px',
        '2xl': '16px',
        '3xl': '20px',
      },
      spacing: {
        sidebar: '256px',
      },
      boxShadow: {
        'soft':  '0 1px 3px 0 rgba(31,29,27,0.06), 0 1px 2px -1px rgba(31,29,27,0.04)',
        'card':  '0 2px 8px 0 rgba(31,29,27,0.07), 0 0 0 1px rgba(31,29,27,0.04)',
        'modal': '0 8px 32px 0 rgba(31,29,27,0.14)',
      },
      fontSize: {
        '2xs': ['0.6875rem', { lineHeight: '1rem' }],
      },
    },
  },
  darkMode: 'class',
  plugins: [],
}
