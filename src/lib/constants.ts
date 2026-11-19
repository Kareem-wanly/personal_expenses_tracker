import type { PaymentMethod } from "@/db/schema";

export const APP_NAME = "مصروفي";
export const APP_DESCRIPTION = "تتبّع مصاريفك اليومية بسهولة واحصل على تقارير شهرية واضحة";

export const DEFAULT_CATEGORIES = [
  { name: "طعام وشراب", icon: "🍔", color: "#f97316" },
  { name: "مواصلات", icon: "🚗", color: "#3b82f6" },
  { name: "فواتير", icon: "💡", color: "#eab308" },
  { name: "تسوّق", icon: "🛍️", color: "#ec4899" },
  { name: "صحة", icon: "💊", color: "#10b981" },
  { name: "ترفيه", icon: "🎬", color: "#8b5cf6" },
  { name: "منزل", icon: "🏠", color: "#14b8a6" },
  { name: "تعليم", icon: "📚", color: "#6366f1" },
  { name: "أخرى", icon: "📦", color: "#64748b" },
] as const;

export const CATEGORY_COLORS = [
  "#f97316",
  "#ef4444",
  "#ec4899",
  "#8b5cf6",
  "#6366f1",
  "#3b82f6",
  "#06b6d4",
  "#14b8a6",
  "#10b981",
  "#84cc16",
  "#eab308",
  "#64748b",
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
