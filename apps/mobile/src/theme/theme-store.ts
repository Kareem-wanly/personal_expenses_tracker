import { storage } from "@/lib/storage";
import { createStore } from "@/lib/store";

export const THEME_CHOICES = ["system", "light", "dark"] as const;
export type ThemeChoice = (typeof THEME_CHOICES)[number];

const KEY = "theme";

function saved(): ThemeChoice {
  const value = storage.get(KEY);
  return THEME_CHOICES.find((choice) => choice === value) ?? "system";
}

const store = createStore<ThemeChoice>(saved());

export const useThemeChoice = store.use;

export function chooseTheme(choice: ThemeChoice) {
  storage.set(KEY, choice);
  store.set(choice);
}
