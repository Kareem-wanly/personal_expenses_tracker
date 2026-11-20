# مصروفي — متتبّع المصاريف اليومية (PWA)

تطبيق ويب عربي (RTL) لتسجيل المصاريف اليومية بسرعة من الجوال، مع تقارير شهرية واضحة.
يُثبَّت على الجوال كتطبيق (PWA) ويعمل على استضافة وقاعدة بيانات **مجانية بالكامل**.

## المزايا

- ⚡ **إضافة مصروف في ثوانٍ**: زر + عائم، لوحة أرقام مباشرة، اختيار التصنيف بلمسة، «اليوم / أمس».
- 🏠 **لوحة رئيسية**: مصروف الشهر، الميزانية المتبقية، اليوم، الأسبوع، المعدل اليومي، التوقّع لنهاية الشهر.
- 🧾 **قائمة المصاريف**: مجمّعة حسب اليوم، بحث في الملاحظات، تصفية حسب التصنيف، تنقّل بين الأشهر، تعديل وحذف.
- 📊 **تقرير شهري**: مقارنة بالشهر السابق، توزيع دائري حسب التصنيف، إنفاق يومي، اتجاه آخر 6 أشهر، طرق الدفع، أكبر 5 مصاريف.
- 📤 **تصدير CSV** متوافق مع Excel (يدعم العربية).
- 🎨 تصنيفات مخصّصة (أيقونة + لون)، 14 عملة، ميزانية شهرية، وضع داكن/فاتح.
- 📱 **PWA**: تثبيت على الشاشة الرئيسية، اختصارات (إضافة مصروف / التقرير)، صفحة بلا اتصال، وإعادة إرسال تلقائية للعمليات عند عودة الاتصال.
- 🔔 **إشعارات Push**: تنبيه عند 80% من الميزانية وعند تجاوزها، تذكير مسائي إن لم تسجّل شيئاً اليوم، وملخص شهري في أول كل شهر — قابلة للتحكم من الإعدادات.
- 📲 **نافذة تثبيت** تظهر عند أول زيارة: زر تثبيت حقيقي على Android/Chrome وتعليمات «إضافة إلى الشاشة الرئيسية» على iPhone.
- 🔐 تسجيل دخول بالبريد وكلمة المرور، وكل مستخدم يرى بياناته فقط.
- 🍏 **واجهة بأسلوب iOS**: شريط تبويبات زجاجي عائم، عناوين كبيرة، قوائم مجمّعة، نوافذ سفلية، ووضع داكن حقيقي.
- 👆 **سحب يمين/يسار بين الشاشات** كتطبيق أصلي، مع انتقالات اتجاهية (View Transitions) وحركات نابضية (Motion).

## التقنيات

| الطبقة | الأداة | لماذا |
| --- | --- | --- |
| Framework | **Next.js 16** (App Router, Server Actions, Cache Components / PPR) | أداء عالٍ وواجهة + API في مشروع واحد |
| UI | **Tailwind CSS v4** + **shadcn/ui** (Base UI) مع RTL | مكوّنات جاهزة وسهلة الوصول |
| الرسوم البيانية | **Recharts** (عبر shadcn charts) | |
| قاعدة البيانات | **Turso** (libSQL/SQLite) + **Drizzle ORM** | مجانية، سريعة، ونفس الكود محلياً (ملف SQLite) |
| المصادقة | **Better Auth** | مفتوحة المصدر، بدون خدمة مدفوعة |
| التحقق | **Zod** | تحقق من كل مدخل على الخادم |
| PWA | **Serwist** (Turbopack) | Service Worker حديث بديل next-pwa |
| الحركة | **React `<ViewTransition>`** + **Motion** | انتقالات الصفحات أصلية في المتصفح، وMotion للتفاعلات الدقيقة |

### ممارسات مطبّقة

- المبالغ تُخزَّن **أعداداً صحيحة بالسنت** (لا أخطاء تقريب)، والتواريخ `YYYY-MM-DD` بتوقيت جهاز المستخدم.
- **Data Access Layer** (`src/lib/dal.ts`): كل قراءة/كتابة تتحقق من الجلسة، وكل استعلام مقيّد بـ `userId`.
- كل Server Action يعيد المصادقة والتحقق بـ Zod ويتأكد من ملكية التصنيف.
- `proxy.ts` للتحويل السريع فقط، والحماية الفعلية في الـ DAL.
- حماية من حقن الصيغ في CSV، ومن open redirect بعد تسجيل الدخول، وترويسات أمان (X-Frame-Options وغيرها).
- واجهة الصفحة تظهر فوراً (static shell) والبيانات تُبثّ داخل `Suspense` مع هياكل تحميل.

## التشغيل محلياً

المتطلبات: Node.js 20+.

```powershell
npm install
```

انسخ ملف البيئة وعدّل `BETTER_AUTH_SECRET` (أي نص عشوائي طوله 32 حرفاً أو أكثر):

```powershell
Copy-Item .env.example .env.local
```

```powershell
npm run db:migrate
```

```powershell
npm run dev
```

افتح http://localhost:3000 وأنشئ حساباً. لملء بيانات تجريبية (3 أشهر) لحساب موجود:

```powershell
npm run db:seed -- you@example.com
```

> ملاحظة: الـ Service Worker معطّل في وضع التطوير. لتجربة الـ PWA استخدم `npm run build` ثم `npm run start`.

### أوامر مفيدة

| الأمر | الوظيفة |
| --- | --- |
| `npm run db:generate` | توليد migration بعد تعديل `src/db/schema.ts` |
| `npm run db:migrate` | تطبيق الـ migrations على قاعدة البيانات في `DATABASE_URL` |
| `npm run db:studio` | واجهة لتصفّح قاعدة البيانات |
| `npm run typecheck` / `npm run lint` | فحص الأنواع والكود |

## النشر المجاني

### 1) قاعدة البيانات على Turso (مجاناً)

1. أنشئ حساباً على [turso.tech](https://turso.tech) وثبّت الـ CLI.
2. أنشئ قاعدة بيانات واحصل على الرابط والتوكن:

```powershell
turso db create expenses
```

```powershell
turso db show expenses --url
```

```powershell
turso db tokens create expenses
```

> الجداول تُنشأ تلقائياً عند كل نشر على Vercel (سكربت `vercel-build` يشغّل `drizzle-kit migrate` قبل البناء).
> لتطبيقها يدوياً من جهازك:

```powershell
$env:DATABASE_URL="libsql://expenses-<org>.turso.io"; $env:DATABASE_AUTH_TOKEN="<token>"; npm run db:migrate
```

### 2) الاستضافة على Vercel (موصى به)

1. ارفع المشروع إلى GitHub.
2. من [vercel.com/new](https://vercel.com/new) استورد المستودع (يتعرّف على Next.js تلقائياً).
3. أضف متغيرات البيئة:
   - `DATABASE_URL` = رابط Turso (`libsql://...`)
   - `DATABASE_AUTH_TOKEN` = التوكن
   - `BETTER_AUTH_SECRET` = نص عشوائي طويل (مختلف عن المحلي)
   - `BETTER_AUTH_URL` (اختياري على Vercel: يُكتشف رابط الموقع تلقائياً، أضفه فقط عند ربط دومين خاص)
   - للإشعارات (انسخها من `.env.local`): `NEXT_PUBLIC_VAPID_PUBLIC_KEY`، `VAPID_PRIVATE_KEY`، `VAPID_SUBJECT`، `CRON_SECRET`
4. Deploy ✅

> **الإشعارات المجدولة**: `vercel.json` يعرّف مهمة يومية (`/api/cron/daily`) تعمل حوالي 17:00 UTC (≈ 8 مساءً بتوقيت دمشق/الرياض).
> خطة Hobby المجانية تسمح بتشغيل يومي واحد بدقة ±59 دقيقة. Vercel يرسل `CRON_SECRET` تلقائياً كـ Bearer token.
> بعد إضافة `NEXT_PUBLIC_VAPID_PUBLIC_KEY` لأول مرة اعمل **Redeploy** لأنه يُضمَّن وقت البناء.

### بديل: Netlify

نفس الخطوات: استورد المستودع من [app.netlify.com](https://app.netlify.com)، فيستخدم Netlify محوّل Next.js تلقائياً. أضف متغيرات البيئة نفسها، و`BETTER_AUTH_URL` **إلزامي** هنا (رابط Netlify)، واجعل أمر البناء `npm run vercel-build` لتطبيق الـ migrations تلقائياً.

### التثبيت على الجوال

- **Android (Chrome)**: افتح الموقع → «تثبيت التطبيق»، أو من صفحة الإعدادات داخل التطبيق.
- **iPhone (Safari)**: زر المشاركة ← «إضافة إلى الشاشة الرئيسية».

## هيكل المشروع

```
src/
├─ app/
│  ├─ (auth)/login, register     صفحات الدخول
│  ├─ (app)/                     الصفحات المحمية + شريط التنقل
│  │  ├─ page.tsx                الرئيسية
│  │  ├─ expenses/ reports/ settings/
│  ├─ api/auth/[...all]          Better Auth
│  ├─ api/export                 تصدير CSV
│  ├─ manifest.ts, sw.ts, serwist/   PWA
├─ components/                   مكوّنات الواجهة (+ ui من shadcn)
├─ db/schema.ts, index.ts        Drizzle
├─ lib/                          auth, dal, money, dates, validations
├─ server/queries.ts, actions.ts طبقة البيانات
└─ proxy.ts                      تحويل غير المسجّلين
drizzle/                         ملفات الـ migrations
```

## أفكار للتطوير لاحقاً

- مصاريف متكررة (اشتراكات وفواتير شهرية) تُضاف تلقائياً.
- ميزانية لكل تصنيف مع تنبيهات.
- مسح الإيصالات بالكاميرا (OCR) أو الإدخال الصوتي.
- تسجيل دخول بـ Google (Better Auth يدعمه بسطرين).
- مزامنة كاملة بلا اتصال (offline-first) عبر IndexedDB.
