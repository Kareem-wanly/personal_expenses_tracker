/**
 * User-facing release notes, newest first. The "What's new" sheet shows the
 * latest release once to every user after an update.
 *
 * ➜ When you ship something users will notice, add a new entry at the TOP
 *   with a new `version` (date-based: YYYY.MM.DD, add .2 for a second release
 *   on the same day). Keep items short, in Arabic, benefit first.
 */
export type Release = {
  version: string;
  date: string;
  title: string;
  items: { icon: string; title: string; body: string }[];
};

export const RELEASES: Release[] = [
  {
    version: "2026.11.21",
    date: "2026-11-21",
    title: "الدخل، الرصيد ورؤى ذكية",
    items: [
      {
        icon: "💼",
        title: "سجّل دخلك واعرف رصيدك",
        body: "من زر + اختر «دخل». نعرض دخل الشهر، الصافي، نسبة الادخار والرصيد الكلي.",
      },
      {
        icon: "✨",
        title: "رؤى ذكية",
        body: "ملاحظات مفيدة من بياناتك: هل ستتجاوز ميزانيتك؟ أين زاد صرفك؟ أي عادة صغيرة تكلّفك أكثر؟",
      },
      {
        icon: "🎯",
        title: "ميزانية لكل تصنيف",
        body: "حدّدها من الإعدادات ← التصنيفات، وتابع تقدّمك وتوقّع تجاوزها قبل أن يحدث.",
      },
      {
        icon: "🔁",
        title: "مصاريف متكررة",
        body: "اختر «التكرار» عند الإضافة ليُضاف الإيجار والاشتراكات تلقائياً في موعدها.",
      },
      {
        icon: "⚡",
        title: "إدخال سريع بجملة",
        body: "اكتب «قهوة 5 بطاقة مبارح» أو «قهوة 5 وسندويشة 7» وتمتلئ الحقول وحدها.",
      },
    ],
  },
  {
    version: "2026.11.20",
    date: "2026-11-20",
    title: "تصميم جديد وإشعارات",
    items: [
      { icon: "🍏", title: "تصميم بأسلوب iOS", body: "شريط تبويبات عائم، سحب بين الشاشات وحركات أنعم." },
      { icon: "🔔", title: "إشعارات مفيدة", body: "تنبيه الميزانية، تذكير مسائي وملخص شهري — تحكّم بها من الإعدادات." },
    ],
  },
];

export const LATEST_RELEASE = RELEASES[0];
