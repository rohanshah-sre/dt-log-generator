export const COLORS = {
  bg: "#0D0D1A",
  cardBg: "rgba(13, 13, 26, 0.2)",
  cardBorder: "#2A2A4A",
  title: "#FFFFFF",
  muted: "#7070A0",
  label: "#A0A0C0",

  purple: "#6C3AD6",
  purpleBright: "#B23BE4",
  purpleDeep: "#6F2EA8",

  blue: "#1C5BE5",
  blueLight: "#54C8E9",
  blueVivid: "#1497FF",
  blueAlt: "#4635D6",

  green: "#73BE28",
  greenBright: "#BDDF28",

  pink: "#E436FF",
} as const;

export const PALETTES = {
  blues: ["#1C5BE5", "#4635D6", "#1497FF", "#54C8E9"],
  purples: ["#B23BE4", "#6C3AD6", "#6F2EA8"],
  greens: ["#BDDF28", "#73BE28"],
} as const;

export const FONTS = {
  mono: '"JetBrains Mono", "Fira Code", Menlo, Monaco, Consolas, monospace',
};

export const cardStyle = (selected = false): React.CSSProperties => ({
  background: COLORS.cardBg,
  border: `1px solid ${selected ? COLORS.green : COLORS.cardBorder}`,
  borderRadius: 12,
  padding: 24,
  cursor: "pointer",
  transition: "transform 160ms ease, border-color 160ms ease, box-shadow 160ms ease",
  boxShadow: selected ? `0 0 18px ${COLORS.green}55` : "none",
  position: "relative",
  color: COLORS.title,
});
