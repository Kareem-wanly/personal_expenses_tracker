import type { IncomeSource, PaymentMethod } from "@/db/schema";

export const APP_NAME = "مصروفي";
export const APP_DESCRIPTION = "تتبّع مصاريفك اليومية بسهولة واحصل على تقارير شهرية واضحة";

export const DEFAULT_CATEGORIES = [
  { name: "طعام وشراب", icon: "🍔", color: "#c8502b" },
  { name: "مواصلات", icon: "🚗", color: "#3e64a0" },
  { name: "فواتير", icon: "💡", color: "#c79227" },
  { name: "تسوّق", icon: "🛍️", color: "#b9506c" },
  { name: "صحة", icon: "💊", color: "#4c8a5b" },
  { name: "ترفيه", icon: "🎬", color: "#7d4e86" },
  { name: "منزل", icon: "🏠", color: "#2c7a78" },
  { name: "تعليم", icon: "📚", color: "#4f55a0" },
  { name: "أخرى", icon: "📦", color: "#6f6a60" },
] as const;

/**
 * Category palette: mid-tone, slightly earthy hues that sit well on paper and
 * on the dark charcoal theme, and stay distinguishable in charts. (Replaced
 * the stock Tailwind 500s; see migration 0004_category_palette.)
 */
export const CATEGORY_COLORS = [
  "#c8502b", // persimmon
  "#b33a2e", // brick
  "#b9506c", // rose
  "#7d4e86", // plum
  "#4f55a0", // indigo
  "#3e64a0", // slate
  "#3a86a0", // steel
  "#2c7a78", // teal
  "#4c8a5b", // moss
  "#7a8233", // olive
  "#c79227", // ochre
  "#6f6a60", // graphite
] as const;

export const CATEGORY_ICONS = [
  "🍔", "☕", "🛒", "🚗", "⛽", "🚌", "💡", "📱", "🌐", "🏠",
  "🛍️", "👕", "💊", "🏥", "🎬", "🎮", "✈️", "📚", "🎁", "💇",
  "🐾", "👶", "🏋️", "💳", "🧾", "🔧", "🍕", "🎓", "💰", "📦",
] as const;

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  cash: "نقداً",
  card: "بطاقة",
  transfer: "تحويل",
};

export const CURRENCIES = [
  { code: "USD", label: "دولار أمريكي" },
  { code: "EUR", label: "يورو" },
  { code: "SAR", label: "ريال سعودي" },
  { code: "AED", label: "درهم إماراتي" },
  { code: "KWD", label: "دينار كويتي" },
  { code: "QAR", label: "ريال قطري" },
  { code: "JOD", label: "دينار أردني" },
  { code: "EGP", label: "جنيه مصري" },
  { code: "SYP", label: "ليرة سورية" },
  { code: "LBP", label: "ليرة لبنانية" },
  { code: "IQD", label: "دينار عراقي" },
  { code: "TRY", label: "ليرة تركية" },
  { code: "MAD", label: "درهم مغربي" },
  { code: "TND", label: "دينار تونسي" },
] as const;

export type CurrencyCode = (typeof CURRENCIES)[number]["code"];

export const INCOME_SOURCE_META: Record<IncomeSource, { label: string; icon: string; color: string }> = {
  salary: { label: "راتب", icon: "💼", color: "#34c759" },
  freelance: { label: "عمل حر", icon: "🧑‍💻", color: "#0a84ff" },
  business: { label: "تجارة", icon: "🏪", color: "#ff9f0a" },
  gift: { label: "هدية", icon: "🎁", color: "#ff2d55" },
  investment: { label: "استثمار", icon: "📈", color: "#5e5ce6" },
  other: { label: "أخرى", icon: "💰", color: "#8e8e93" },
};
