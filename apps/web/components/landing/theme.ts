// ROLET landing tokens.
//
// The values now resolve to the CSS custom properties in app/globals.css, so
// every section that imports this file draws from the one substrate: the
// deactivated CRT, the phosphor text scale and the single brass accent.
export const C = {
  soot: "var(--color-void)",
  gunmetal: "var(--color-surface-2)",
  graphite: "var(--color-surface-3)",
  bone: "var(--color-phosphor)",
  worn: "var(--color-phosphor-dim)",
  brass: "var(--color-brass)",
  wood: "#3A2A1F",
  sodium: "var(--color-brass-bright)",
  signal: "var(--color-alert)",
  patina: "var(--color-patina)",
} as const;

export const F = {
  display: "var(--font-big-shoulders), 'Arial Narrow', sans-serif",
  sans: "var(--font-plex-sans), system-ui, sans-serif",
  mono: "var(--font-plex-mono), ui-monospace, monospace",
} as const;
