export type Release = { version: string; title: string; items: { title: string; body: string }[] };

/** Newest first. Shown once to each user after the update. Short, in Arabic, benefit first. */
export const RELEASES: Release[] = [
  {
    version: "2026.11.24",
    title: "مصروفي، تطبيق حقيقي",
    items: [
      { title: "كل شيء بين يديك", body: "المصاريف والدخل والديون والأهداف والتقارير، بحركة سلسة." },
      { title: "اكتب جملة", body: "«قهوة 5 بطاقة مبارح» تكفي لتسجيل المصروف." },
      { title: "اضغط مطوّلاً", body: "على أي عملية لتعديلها أو تكرارها أو حذفها، مع تراجع." },
      { title: "قفل بالرمز أو البصمة", body: "من الإعدادات، لا أحد يرى مصاريفك غيرك." },
    ],
  },
];
