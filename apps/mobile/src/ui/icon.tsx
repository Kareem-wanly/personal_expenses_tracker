import Svg, { Path } from "react-native-svg";

const paths = {
  home: "M4 11 12 4l8 7v8a1 1 0 0 1-1 1h-4v-6H9v6H5a1 1 0 0 1-1-1z",
  ledger: "M6 3h12v18l-3-2-3 2-3-2-3 2zM9 8h6M9 12h6",
  plus: "M12 5v14M5 12h14",
  reports: "M5 20V11M12 20V4M19 20v-6",
  chevronLeft: "m14 6-6 6 6 6",
  chevronRight: "m10 6 6 6-6 6",
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
