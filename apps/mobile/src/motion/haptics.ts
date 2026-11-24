import * as Haptics from "expo-haptics";
import { Platform } from "react-native";

const available = Platform.OS !== "web";
const ignore = () => undefined;

/** Touch feedback; phones without it simply do nothing. */
export const haptics = {
  tap: () => void (available && Haptics.selectionAsync().catch(ignore)),
  lift: () => void (available && Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(ignore)),
  success: () =>
    void (available && Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(ignore)),
  error: () =>
    void (available && Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(ignore)),
};
