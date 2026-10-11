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

/**
 * Hex twins of the palette above. three.js cannot resolve CSS custom
 * properties, so anything that builds a THREE.Color must read from here.
 */
export const CH = {
  soot: "#0a0a0a",
  gunmetal: "#1a1a1a",
  graphite: "#222222",
  bone: "#eaeaea",
  worn: "#9a9a9a",
  brass: "#c6a15b",
  brassDim: "#8a703f",
  sodium: "#e5c378",
  signal: "#e61919",
  patina: "#52c41a",
  wood: "#3A2A1F",
} as const;
