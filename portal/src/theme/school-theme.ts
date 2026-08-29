/**
 * school-theme.ts — School-themed design tokens for TrueForge UI portal.
 * Generic but visually school-oriented: warm chalkboard palette.
 */

export const schoolTheme = {
  colors: {
    // Chalkboard green background
    background: '#1a1f25',
    backgroundAlt: '#222831',
    backgroundCard: '#2a313d',
    backgroundHover: '#323946',

    // Chalk-style text
    text: '#e5e5e5',
    textMuted: '#a0a0b0',
    textStrong: '#ffffff',

    // School accent colors
    primary: '#4a90d9',      // Blue chalk
    primaryHover: '#3d7bc8',
    primaryLight: '#4a90d933',

    secondary: '#f5a623',    // Yellow chalk
    secondaryHover: '#e09415',

    success: '#7ed321',      // Green chalk
    warning: '#f5a623',      // Yellow chalk
    error: '#d0021b',        // Red chalk
    info: '#4a90d9',

    border: '#444b5a',
    borderLight: '#5a6475',
    divider: '#3a4150',
  },
  fonts: {
    body: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    mono: "'Fira Code', 'Monaco', 'Consolas', monospace",
    heading: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
    xxl: '3rem',
  },
  borderRadius: {
    sm: '0.25rem',
    md: '0.5rem',
    lg: '0.75rem',
    xl: '1rem',
    full: '9999px',
  },
  shadows: {
    card: '0 2px 8px rgba(0, 0, 0, 0.3)',
    cardHover: '0 4px 16px rgba(0, 0, 0, 0.4)',
    elevated: '0 8px 24px rgba(0, 0, 0, 0.4)',
  },
  transitions: {
    fast: 'all 150ms ease',
    base: 'all 250ms ease',
    slow: 'all 400ms cubic-bezier(0.4, 0, 0.2, 1)',
  },
} as const;

export type SchoolTheme = typeof schoolTheme;
export default schoolTheme;