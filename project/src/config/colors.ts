// Àpínlẹ̀rọ Brand Colors
// Consistent color scheme across the entire platform

export const colors = {
  // Primary brand colors
  primary: {
    dark: '#1e3a5f',      // Dark blue - Used for headers, titles, main branding
    main: '#0d9488',       // Teal - Used for buttons, links, interactive elements
    light: '#14b8a6',      // Light teal - Used for hover states
    lighter: '#2dd4bf',    // Lighter teal - Used for accents
  },

  // Tailwind equivalents (for consistency)
  tailwind: {
    primaryDark: 'text-slate-800',
    primaryMain: 'bg-teal-600',
    primaryMainText: 'text-teal-600',
    primaryLight: 'bg-teal-500',
    primaryLighter: 'bg-teal-400',
    primaryHover: 'hover:bg-teal-700',
    primaryBorder: 'border-teal-600',
    primaryRing: 'ring-teal-500',
  },

  // Gradient backgrounds
  gradients: {
    hero: 'from-teal-600 via-teal-700 to-emerald-800',
    subtle: 'from-teal-50 via-white to-emerald-50',
  }
} as const;

// Helper function to get inline styles
export const getHeaderColor = () => ({ color: colors.primary.dark });
export const getButtonColor = () => ({ backgroundColor: colors.primary.main });
