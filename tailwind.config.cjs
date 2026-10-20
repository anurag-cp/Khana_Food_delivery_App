/**
 * KHANA / DESIGN BRIEF
 * Type scale: Newsreader display 40/44, section 28/34, row title 18/24;
 * Manrope body 15/22, supporting 12/17; IBM Plex Mono metadata 10/14,
 * prices and order numbers 12/16. Mobile-first, with a restrained 1.2 scale.
 * Palette: warm paper #F3EBDD, ink #1B1A17, chilli #C8321E, turmeric #E3A72F.
 * Components: square corners (0–2px), 1px ink rules, dashed/dotted leaders,
 * no shadows. Use stamps for status and monospaced labels for service data.
 */
module.exports = {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    borderRadius: { none: '0px', sm: '1px', DEFAULT: '2px' },
    extend: {
      colors: {
        paper: 'var(--paper)',
        ink: 'rgb(27 26 23 / <alpha-value>)',
        chilli: 'var(--chilli)',
        turmeric: 'var(--turmeric)',
      },
      fontFamily: {
        display: ['Newsreader', 'serif'],
        sans: ['Manrope', 'sans-serif'],
        mono: ['IBM Plex Mono', 'monospace'],
      },
      fontSize: {
        'display-xl': ['40px', { lineHeight: '1.1', letterSpacing: '-0.04em' }],
        'display-lg': ['28px', { lineHeight: '1.18', letterSpacing: '-0.025em' }],
        'row-title': ['18px', { lineHeight: '1.3', letterSpacing: '-0.015em' }],
        'body-sm': ['12px', { lineHeight: '1.45' }],
        'meta': ['10px', { lineHeight: '1.4' }],
      },
      boxShadow: { none: 'none' },
      spacing: { '18': '4.5rem', '22': '5.5rem' },
    },
  },
  plugins: [],
};
