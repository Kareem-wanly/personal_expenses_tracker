import { ChevronRightIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { APP_NAME } from "@masrufi/core/constants";

export const metadata: Metadata = {
  title: "سياسة الخصوصية",
  description: `كيف يتعامل ${APP_NAME} مع بياناتك.`,
};

const UPDATED = "22 نوفمبر 2026";
const CONTACT = "https://github.com/Kareem-wanly/personal_expenses_tracker/issues";

/**
 * Public privacy policy (required by Google Play and the App Store).
 * Keep it in sync with what the app actually stores — see packages/db/src/schema.ts.
 */
export default function PrivacyPage() {
  return (
    <main className="mx-auto min-h-dvh w-full max-w-2xl px-5 pb-16 pt-safe">
      <Link
        href="/"
        className="mt-6 inline-flex items-center gap-1 text-[15px] font-medium text-primary"
      >
        <ChevronRightIcon className="size-4" />
        {APP_NAME}
      </Link>

      <header className="mt-6">
        <h1 className="text-[34px] font-semibold leading-tight">سياسة الخصوصية</h1>
        <p className="mt-2 text-[14px] text-muted-foreground">آخر تحديث: {UPDATED}</p>
        <div className="mt-5 h-px bg-hairline" />
      </header>

      <article className="mt-6 space-y-7 text-[16px] leading-[1.9]">
        <p>
          {APP_NAME} تطبيق لتسجيل مصاريفك ودخلك. نجمع فقط ما يلزم لتشغيله، ولا نبيع بياناتك
          ولا نعرض إعلانات ولا نستخدم أدوات تتبّع أو تحليلات من جهات خارجية.
        </p>

        <Section title="ما الذي نحفظه">
          <ul className="list-disc space-y-1.5 ps-5">
            <li>اسمك وبريدك الإلكتروني، وكلمة المرور مشفّرة (لا نستطيع قراءتها).</li>
            <li>
              إن دخلت بحساب Google: اسمك وبريدك وصورة ملفك فقط، ومعرّف الحساب. لا نصل إلى بريدك أو ملفاتك على
              Google.
            </li>
            <li>ما تُدخله: المصاريف والدخل والتصنيفات والملاحظات والميزانيات والمصاريف المتكررة والديون وأهداف الادخار.</li>
            <li>عملتك والمنطقة الزمنية لجهازك (لمعرفة «اليوم» الصحيح لديك).</li>
            <li>إن فعّلت الإشعارات: عنوان الاشتراك الخاص بمتصفحك ونوع الجهاز، لإرسالها إليك فقط.</li>
            <li>ملفات تعريف ارتباط ضرورية: جلسة الدخول، ومنطقتك الزمنية.</li>
          </ul>
        </Section>

        <Section title="لماذا">
          لتشغيل التطبيق فقط: حفظ بياناتك وعرض تقاريرك وإرسال التنبيهات التي فعّلتها. الرؤى
          والملاحظات تُحسب بقواعد حسابية على بياناتك، ولا تُرسل لأي خدمة ذكاء اصطناعي.
        </Section>

        <Section title="أين تُحفظ ومن يعالجها">
          <ul className="list-disc space-y-1.5 ps-5">
            <li>قاعدة البيانات: Turso (خوادم في فرانكفورت، الاتحاد الأوروبي).</li>
            <li>استضافة التطبيق: Vercel.</li>
            <li>تسجيل الدخول بحساب Google (اختياري): Google.</li>
            <li>أسعار الصرف: ExchangeRate-API. يتصل به خادمنا فقط لجلب الأسعار، ولا نرسل إليه أي بيانات عنك.</li>
            <li>
              الإشعارات: تمرّ مشفّرة عبر خدمة الإشعارات الخاصة بمتصفحك (Google أو Apple أو
              Mozilla)، ولا تستطيع هذه الخدمات قراءة محتواها.
            </li>
          </ul>
          <p className="mt-2">لا نشارك بياناتك مع أي جهة أخرى.</p>
        </Section>

        <Section title="حقوقك">
          <ul className="list-disc space-y-1.5 ps-5">
            <li>
              <b>نسخة من بياناتك:</b> من الإعدادات ← «البيانات» يمكنك تنزيل كل بياناتك في ملف
              واحد في أي وقت.
            </li>
            <li>
              <b>حذف الحساب:</b> من الإعدادات ← «حذف الحساب». يُحذف حسابك وكل بياناتك فوراً من
              قاعدة البيانات ولا يمكن استرجاعها. قد تبقى نسخ في النسخ الاحتياطية التلقائية لدى
              مزوّد قاعدة البيانات لفترة قصيرة ثم تُمحى تلقائياً.
            </li>
            <li>إيقاف الإشعارات في أي وقت من الإعدادات.</li>
          </ul>
        </Section>

        <Section title="الأطفال">التطبيق غير موجّه لمن هم دون 13 عاماً.</Section>

        <Section title="التغييرات">
          إذا غيّرنا هذه السياسة نحدّث التاريخ أعلاه، ونخبرك داخل التطبيق إن كان التغيير جوهرياً.
        </Section>

        <Section title="تواصل معنا">
          لأي سؤال عن خصوصيتك:{" "}
          <a href={CONTACT} className="font-medium text-primary underline underline-offset-4" dir="ltr">
            GitHub Issues
          </a>
          .
        </Section>
      </article>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-2 text-[20px] font-semibold">{title}</h2>
      <div className="text-foreground/90">{children}</div>
    </section>
  );
}
