import { useEffect } from "react";
import { Keyboard, type KeyboardEvent, Platform } from "react-native";
import { type SharedValue, useSharedValue, withTiming } from "react-native-reanimated";

const SHOW = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
const HIDE = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

/** How much of the screen the keyboard covers, eased like the keyboard itself. */
export function useKeyboardHeight(): SharedValue<number> {
  const height = useSharedValue(Keyboard.metrics()?.height ?? 0);
  useEffect(() => {
    const follow = (to: number) => (event?: KeyboardEvent) =>
      height.set(withTiming(to || 0, { duration: event?.duration || 220 }));
    const shown = Keyboard.addListener(SHOW, (event) => follow(event.endCoordinates.height)(event));
    const hidden = Keyboard.addListener(HIDE, (event) => follow(0)(event));
    return () => {
      shown.remove();
      hidden.remove();
    };
  }, [height]);
  return height;
}
