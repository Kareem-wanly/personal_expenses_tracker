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
