const MESSAGES: Record<string, string> = {
  INVALID_EMAIL_OR_PASSWORD: "البريد أو كلمة المرور غير صحيحة",
  INVALID_EMAIL: "البريد غير صالح",
  USER_ALREADY_EXISTS: "يوجد حساب بهذا البريد",
  USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL: "يوجد حساب بهذا البريد",
  PASSWORD_TOO_SHORT: "كلمة المرور 8 أحرف على الأقل",
  INVALID_TOKEN: "انتهت صلاحية الرابط، اطلب رابطاً جديداً",
};

type AuthError = { code?: string; status?: number };

export function authMessage({ code, status }: AuthError): string {
  if (code && MESSAGES[code]) return MESSAGES[code];
  if (status === 429) return "محاولات كثيرة، حاول بعد قليل";
  return status ? "تعذّر إتمام الطلب" : "لا يوجد اتصال بالخادم";
}
