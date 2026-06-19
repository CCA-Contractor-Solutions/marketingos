/**
 * MarketingOS design tokens for the mobile app.
 *
 * Mirrors the sibling web artifact (artifacts/web/src/index.css) so both
 * surfaces share one visual identity. HSL values from the web tokens are
 * converted to hex here.
 */

const colors = {
  light: {
    // Legacy aliases (kept for backward compatibility)
    text: "#11132a",
    tint: "#4f46e5",

    // Core surfaces
    background: "#f6f7fb",
    foreground: "#11132a",

    // Cards / elevated surfaces
    card: "#ffffff",
    cardForeground: "#11132a",
    surface2: "#fbfbfe",

    // Primary action color (buttons, links, active states)
    primary: "#4f46e5",
    primaryForeground: "#ffffff",
    brand600: "#4338ca",
    brand50: "#eef0fe",

    // Secondary / less-emphasis interactive surfaces
    secondary: "#eef0fe",
    secondaryForeground: "#4338ca",

    // Muted / subdued elements (dividers, timestamps, placeholders)
    muted: "#eef0f5",
    mutedForeground: "#8a8fab",
    inkSoft: "#4a4f6b",

    // Accent highlights (badges, selected items, focus rings)
    accent: "#eef0fe",
    accentForeground: "#4338ca",

    // Destructive actions (delete, error states)
    destructive: "#f43f6b",
    destructiveForeground: "#ffffff",

    // Borders and input outlines
    border: "#e9eaf3",
    input: "#e9eaf3",

    // Extended brand accents (status colors)
    violet: "#7c3aed",
    coral: "#fb6f5a",
    amber: "#f5a524",
    emerald: "#18b386",
    rose: "#f43f6b",
    sky: "#2f9bf2",
  },

  // Border radius (in px). Synced from the web artifact's --radius (0.5rem).
  radius: 8,
};

export default colors;
