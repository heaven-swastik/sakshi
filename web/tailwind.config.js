/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        paper:   '#F5F6F8',
        ink:     '#0F1217',
        slate:   '#667085',
        fog:     '#E4E7EC',
        crimson: '#C0153F',
        jade:    '#12805C',
        // Derived shades
        'jade-light':    '#E6F4EF',
        'crimson-light': '#FAE8EC',
        'amber':         '#B45309',
        'amber-light':   '#FEF3C7',
      },
      fontFamily: {
        display:    ['"Bricolage Grotesque Variable"', '"Bricolage Grotesque"', 'sans-serif'],
        body:       ['"Hanken Grotesk Variable"', '"Hanken Grotesk"', '"Noto Sans Devanagari"', 'sans-serif'],
        devanagari: ['"Noto Sans Devanagari"', 'sans-serif'],
      },
      borderRadius: {
        sm: '6px',
        md: '10px',
        lg: '16px',
        xl: '24px',
      },
      spacing: {
        // 8px scale additions
        18: '4.5rem',
        22: '5.5rem',
      },
      boxShadow: {
        card:  '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
        lifted:'0 2px 8px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.05)',
        dock:  '0 4px 24px rgba(0,0,0,0.10), 0 1px 4px rgba(0,0,0,0.06)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'scale-up': 'scaleUp 0.4s cubic-bezier(0.34,1.56,0.64,1)',
        'slide-up': 'slideUp 0.3s ease-out',
      },
      keyframes: {
        fadeIn:  { from: { opacity: 0 }, to: { opacity: 1 } },
        scaleUp: { from: { transform: 'scale(0)', opacity: 0 }, to: { transform: 'scale(1)', opacity: 1 } },
        slideUp: { from: { transform: 'translateY(8px)', opacity: 0 }, to: { transform: 'translateY(0)', opacity: 1 } },
      },
    },
  },
  plugins: [],
}
