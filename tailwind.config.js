/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: 'var(--color-bg)',
        surface: {
          DEFAULT: 'var(--color-surface)',
          hover: 'var(--color-surface-hover)',
        },
        border: 'var(--color-border)',
        foreground: 'var(--color-text)',
        muted: 'var(--color-muted)',
        accent: {
          DEFAULT: 'var(--color-accent)',
          hover: '#2563EB',
        },
        // Solid fills for buttons with white text (WCAG AA >= 4.5:1)
        action: { DEFAULT: '#2563EB', hover: '#1D4ED8' },
        live: { DEFAULT: 'var(--color-live)', solid: '#DC2626', 'solid-hover': '#B91C1C' },
        success: 'var(--color-success)',
        warning: 'var(--color-warning)',
      },
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          'Helvetica',
          'Arial',
          'sans-serif',
        ],
        mono: [
          'ui-monospace',
          'SFMono-Regular',
          'Menlo',
          'Monaco',
          'Consolas',
          'monospace',
        ],
      },
    },
  },
  plugins: [],
};
