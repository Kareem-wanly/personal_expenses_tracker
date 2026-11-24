# تطبيق أندرويد (APK)

غلاف Trusted Web Activity حول الموقع المنشور: يفتح
`https://personal-expenses-tracker-beta.vercel.app` بشاشة كاملة بلا شريط عنوان.
أي تحديث للموقع يصل للتطبيق مباشرة؛ أعد بناء الـ APK فقط عند تغيير الاسم أو
الأيقونة أو الرابط أو الإعدادات في `twa-manifest.json` (وارفع `appVersionCode`).

## البناء

```powershell
node android/build.mjs
```

ينتج `apps/web/public/download/masrufi.apk` (موقّعاً)، ويُنشر مع الموقع على Vercel.

## الأدوات (خارج المستودع)

في `%USERPROFILE%\.masrufi-android\`:

| المجلد | المحتوى |
| --- | --- |
| `jdk-17*` | Temurin JDK 17 |
| `sdk` | Android SDK (build-tools 35، platform 35) |
| `bubblewrap` | `npm i @bubblewrap/cli` |
| `signing` | `masrufi.keystore` + `keystore-password.txt` |
| `project` | مشروع Gradle المولَّد (يُعاد إنشاؤه في كل بناء) |

**مفتاح التوقيع (`signing`) لا يدخل المستودع أبداً. احتفظ بنسخة احتياطية منه:**
إن ضاع لا يمكن تحديث التطبيق المثبّت، وسيضطر المستخدمون لحذفه وتثبيته من جديد.

## ربط الموقع بالتطبيق

`apps/web/public/.well-known/assetlinks.json` يحمل بصمة SHA-256 لمفتاح التوقيع. هذا ما
يخفي شريط العنوان داخل التطبيق. لعرض البصمة:

```powershell
& "$env:USERPROFILE\.masrufi-android\jdk-17*\bin\keytool.exe" -list -v -keystore "$env:USERPROFILE\.masrufi-android\signing\masrufi.keystore" -alias masrufi
```
