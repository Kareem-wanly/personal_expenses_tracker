import { PressableScale } from "@/motion/pressable-scale";
import type { Colors } from "@/theme/colors";
import { useColors } from "@/theme/theme";

import { Icon, type IconName } from "./icon";

type Props = { label: string; icon: IconName; color?: keyof Colors; disabled?: boolean; onPress: () => void };

export function IconButton({ label, icon, color = "accent", disabled, onPress }: Props) {
  const colors = useColors();
  return (
    <PressableScale accessibilityRole="button" accessibilityLabel={label} to={0.8} hitSlop={10} disabled={disabled} onPress={onPress}>
      <Icon name={icon} color={colors[color]} size={21} />
    </PressableScale>
  );
}
