import React from 'react';
import { schoolTheme } from './school-theme';

export { schoolTheme } from './school-theme';
export type { SchoolTheme } from './school-theme';

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  React.useEffect(() => {
    const root = document.documentElement;
    const vars = {
      '--tf-bg': schoolTheme.colors.background,
      '--tf-bg-alt': schoolTheme.colors.backgroundAlt,
      '--tf-bg-card': schoolTheme.colors.backgroundCard,
      '--tf-text': schoolTheme.colors.text,
      '--tf-primary': schoolTheme.colors.primary,
      '--tf-secondary': schoolTheme.colors.secondary,
      '--tf-border': schoolTheme.colors.border,
      '--tf-font-body': schoolTheme.fonts.body,
      '--tf-font-mono': schoolTheme.fonts.mono,
    };
    Object.entries(vars).forEach(([k, v]) => root.style.setProperty(k, v));
  }, []);

  return <>{children}</>;
};