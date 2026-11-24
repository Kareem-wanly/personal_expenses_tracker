import { Easing } from "react-native-reanimated";

/** One vocabulary of motion for the whole app. Reanimated skips it all when the phone asks for less motion. */
export const springs = {
  /** Presses, thumbs, checks: quick with a hint of overshoot. */
  snappy: { stiffness: 520, damping: 38, mass: 0.9 },
  /** Sheets, pages, lifted rows. */
  gentle: { stiffness: 300, damping: 32, mass: 1 },
  /** Things that pop: badges, the splash card. */
  pop: { stiffness: 420, damping: 18, mass: 0.8 },
};

export const easeOut = Easing.bezier(0.32, 0.72, 0, 1);

export const durations = { fast: 180, normal: 320, slow: 560, chart: 720 };

/** Delay between siblings that appear one after another. */
export const STAGGER = 50;
