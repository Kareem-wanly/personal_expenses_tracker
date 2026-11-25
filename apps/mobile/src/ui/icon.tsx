import Svg, { Path } from "react-native-svg";

const paths = {
  home: "M4 11 12 4l8 7v8a1 1 0 0 1-1 1h-4v-6H9v6H5a1 1 0 0 1-1-1z",
  ledger: "M6 3h12v18l-3-2-3 2-3-2-3 2zM9 8h6M9 12h6",
  plus: "M12 5v14M5 12h14",
  reports: "M5 20V11M12 20V4M19 20v-6",
  chevronLeft: "m14 6-6 6 6 6",
  chevronRight: "m10 6 6 6-6 6",
  check: "m5 12 5 5 9-10",
  edit: "M4 20h4L19 9l-4-4L4 16zM13 7l4 4",
  copy: "M9 9h11v11H9zM5 15H4V4h11v1M14.500 12v5M12 14.500h5",
  trash: "M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13",
  repeat: "M4 11V9a3 3 0 0 1 3-3h11l-3-3M20 13v2a3 3 0 0 1-3 3H6l3 3",
  tag: "M4 4h8l8 8-8 8-8-8zM8.500 8.500h.01",
  key: "M14 10a4 4 0 1 0-3.500 4L12 15.500h2V18h2v2h4v-3z",
  lock: "M6 11h12v9H6zM9 11V8a3 3 0 0 1 6 0v3",
  fingerprint: "M7 12a5 5 0 0 1 10 0v2M4 13v-1a8 8 0 0 1 14-5M12 12v3a6 6 0 0 1-1.500 4M16 17a9 9 0 0 1-1 3M8 15a6 6 0 0 1-1 3",
  download: "M12 4v11M7 11l5 5 5-5M5 20h14",
  upload: "M12 20V9M7 13l5-5 5 5M5 4h14",
  shield: "M12 3l8 3v6c0 5-4 8-8 9-4-1-8-4-8-9V6zM9 12l2 2 4-4",
  sparkle: "M12 4l2 6 6 2-6 2-2 6-2-6-6-2 6-2z",
  logout: "M10 4H5v16h5M14 8l4 4-4 4M18 12H9",
  backspace: "M20 6H9l-6 6 6 6h11zM12 10l4 4M16 10l-4 4",
  cloudOff: "M3 3l18 18M8 7a6 6 0 0 1 9.5 3A4 4 0 0 1 20 16.5M17 19H7a4 4 0 0 1-1.5-7.7",
  more: "M4 7h10M18 7h2M4 17h2M10 17h10M14 5v4M6 15v4",
};

export type IconName = keyof typeof paths;

type Props = { name: IconName; color: string; size?: number };

export function Icon({ name, color, size = 24 }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d={paths[name]} stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}
