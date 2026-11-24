/** "دفتر": warm paper and ink, one persimmon accent, hairlines instead of shadows. */
const light = {
  background: "#f3f0e8",
  card: "#fbfaf6",
  text: "#1a1915",
  muted: "#6f6a5f",
  ink: "#1a1915",
  onInk: "#f6f3ec",
  hairline: "#e2ddd1",
  fill: "#ebe7dc",
  accent: "#c8502b",
  positive: "#2f7a4b",
  negative: "#b3261e",
  warning: "#a8651a",
};

export type Colors = typeof light;

const dark: Colors = {
  background: "#12110e",
  card: "#1b1a16",
  text: "#ece8de",
  muted: "#9a9486",
  ink: "#ece8de",
  onInk: "#12110e",
  hairline: "#2f2d27",
  fill: "#26241f",
  accent: "#ec7a52",
  positive: "#6cc08a",
  negative: "#f2665a",
  warning: "#e3a148",
};

export const palettes = { light, dark };
