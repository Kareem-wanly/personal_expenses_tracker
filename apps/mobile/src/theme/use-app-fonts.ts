import { ElMessiri_600SemiBold } from "@expo-google-fonts/el-messiri/600SemiBold";
import { NotoNaskhArabic_400Regular } from "@expo-google-fonts/noto-naskh-arabic/400Regular";
import { NotoNaskhArabic_600SemiBold } from "@expo-google-fonts/noto-naskh-arabic/600SemiBold";
import { useFonts } from "expo-font";

/** True when text can be shown; a failed font must not block the app. */
export function useAppFonts(): boolean {
  const [loaded, error] = useFonts({
    ElMessiri_600SemiBold,
    NotoNaskhArabic_400Regular,
    NotoNaskhArabic_600SemiBold,
  });
  return loaded || error !== null;
}
