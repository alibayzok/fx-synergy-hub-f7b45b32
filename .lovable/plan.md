

# قائمة الترحيل الكاملة - ASSASSIN FX Migration Checklist

المشروع جاهز للترحيل بشكل ممتاز. عندك ملف `MIGRATION_GUIDE.md` موجود بالفعل يغطي معظم النقاط، لكن ينقصه بعض الأشياء الجديدة. هذه القائمة الشاملة والمحدّثة:

---

## المرحلة 1: التحضير

- [ ] تصدير الكود من GitHub (Settings > GitHub > Connect)
- [ ] استنساخ المستودع محلياً: `git clone ...`
- [ ] تثبيت الحزم: `npm install`
- [ ] إنشاء مشروع Supabase جديد على [supabase.com](https://supabase.com)
- [ ] نسخ Project URL + Anon Key + Service Role Key

---

## المرحلة 2: قاعدة البيانات (48+ جدول)

- [ ] تنفيذ `scripts/export-schema.sql` في SQL Editor (يشمل الجداول، الدوال، السياسات، الفهارس)
- [ ] التأكد من جدول `signal_updates` (جديد - قد يحتاج إضافة يدوية إذا لم يكن في السكريبت)
- [ ] التأكد من عمود `referral_code` في جدول `profiles`
- [ ] تفعيل Realtime على الجداول المطلوبة (messages, notifications, etc.)
- [ ] التحقق من جميع الـ 130+ RLS Policy

---

## المرحلة 3: Storage Buckets (8 حاويات)

أنشئ هذه الحاويات كـ **Public** في Supabase Dashboard > Storage:

- [ ] `avatars`
- [ ] `lesson-videos`
- [ ] `cms-assets`
- [ ] `article-images`
- [ ] `support-attachments`
- [ ] `analysis-attachments`
- [ ] `post-attachments`
- [ ] `signal-attachments`

---

## المرحلة 4: Edge Functions (10 وظائف)

تثبيت CLI ونشر الوظائف:

```text
supabase login
supabase link --project-ref YOUR_PROJECT_ID
```

| الوظيفة | الأسرار المطلوبة |
|---------|-----------------|
| chat | GOOGLE_AI_API_KEY |
| market-data | FINNHUB_API_KEY |
| moderate-image | LOVABLE_API_KEY |
| send-push-notification | SUPABASE_SERVICE_ROLE_KEY |
| fetch-news | - |
| fetch-article | - |
| fetch-calendar | - |
| marqeta-cards | MARQETA_APP_TOKEN, MARQETA_ADMIN_TOKEN, MARQETA_BASE_URL |
| telegram-webhook | TELEGRAM_BOT_TOKEN, TELEGRAM_VIP_CHAT_ID, TELEGRAM_PUBLIC_CHAT_ID, TELEGRAM_NEWS_CHAT_ID, TELEGRAM_WEBHOOK_SECRET |
| setup-telegram-webhook | TELEGRAM_BOT_TOKEN, TELEGRAM_WEBHOOK_SECRET |

- [ ] إعداد جميع الأسرار عبر `supabase secrets set KEY=VALUE`
- [ ] نشر كل وظيفة: `supabase functions deploy FUNCTION_NAME`
- [ ] بعد النشر، تشغيل `setup-telegram-webhook` لتسجيل عنوان Webhook الجديد مع Telegram

---

## المرحلة 5: تعديلات الكود (4 ملفات فقط)

### 5.1 ملف `.env`
```text
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your_anon_key
VITE_SUPABASE_PROJECT_ID=YOUR_PROJECT_ID
```

### 5.2 ملف `src/config/environment.ts`
- [ ] تغيير `APP_URLS.production` إلى الدومين الخاص بك
- [ ] تغيير `APP_URLS.preview` إلى `http://localhost:8080`

### 5.3 ملف `src/lib/auth-helpers.ts`
- [ ] تغيير `USE_LOVABLE_AUTH = false`

### 5.4 ملف `capacitor.config.ts` (لبناء APK)
- [ ] تغيير `appId` إلى `com.assassinfx.app`
- [ ] حذف قسم `server` بالكامل

---

## المرحلة 6: Google OAuth

- [ ] إنشاء مشروع في Google Cloud Console
- [ ] تفعيل Google+ API
- [ ] إنشاء OAuth 2.0 credentials (Web Application)
- [ ] إضافة Redirect URI: `https://YOUR_PROJECT.supabase.co/auth/v1/callback`
- [ ] لصق Client ID و Client Secret في Supabase Dashboard > Auth > Providers > Google

---

## المرحلة 7: Firebase Push Notifications

- [ ] التحقق من إعدادات `src/lib/firebase-config.ts` (أو تحديثها لمشروع Firebase مختلف)
- [ ] التحقق من `public/sw.js` (Service Worker)
- [ ] إعداد VAPID Key إذا غيّرت مشروع Firebase

---

## المرحلة 8: Telegram Bot (مهم!)

- [ ] التأكد من أن الـ Bot Token نفسه مضاف كـ Secret في Supabase الجديد
- [ ] التأكد من إضافة Chat IDs الثلاثة (VIP, Public, News)
- [ ] استدعاء `setup-telegram-webhook` لتسجيل URL الجديد:
  ```text
  curl -X POST https://YOUR_PROJECT.supabase.co/functions/v1/setup-telegram-webhook
  ```
- [ ] اختبار النشر من تلغرام والتأكد من وصول الإشارات والمقالات

---

## المرحلة 9: بناء ونشر

### ويب:
- [ ] `npm run build`
- [ ] نشر على Vercel أو Netlify
- [ ] تحديث `APP_URLS.production` بالرابط النهائي
- [ ] تحديث Auth Redirect URLs في Supabase

### APK:
- [ ] `npm run build`
- [ ] `npx cap add android`
- [ ] `npx cap sync android`
- [ ] `npx cap open android`
- [ ] Build > Generate Signed APK

---

## المرحلة 10: اختبار نهائي

- [ ] تسجيل حساب جديد
- [ ] تسجيل دخول بـ Google OAuth
- [ ] إعادة تعيين كلمة المرور
- [ ] استقبال إشارة من تلغرام
- [ ] استقبال تحديث على إشارة
- [ ] نشر مقال من تلغرام
- [ ] نشر إشارة سريعة من داخل التطبيق (أدمن)
- [ ] نشر تحليل سريع من داخل التطبيق (أدمن)
- [ ] اختبار المساعد الذكي (AI Chat)
- [ ] اختبار بيانات الأسواق
- [ ] اختبار إشعارات الدفع (Push)
- [ ] اختبار نظام التلعيب (النقاط والشارات)
- [ ] اختبار الدعم الفني
- [ ] اختبار نظام الرسائل الخاصة
- [ ] اختبار المجتمع (الغرف، المواضيع)

---

## ملخص الأسرار المطلوبة (15 سر)

| السر | الاستخدام |
|------|-----------|
| SUPABASE_URL | تلقائي |
| SUPABASE_ANON_KEY | تلقائي |
| SUPABASE_SERVICE_ROLE_KEY | Push Notifications |
| GOOGLE_AI_API_KEY | المساعد الذكي |
| FINNHUB_API_KEY | بيانات الأسواق |
| LOVABLE_API_KEY | فحص الصور |
| TELEGRAM_BOT_TOKEN | بوت تلغرام |
| TELEGRAM_VIP_CHAT_ID | قناة VIP |
| TELEGRAM_PUBLIC_CHAT_ID | القناة العامة |
| TELEGRAM_NEWS_CHAT_ID | قناة الأخبار |
| TELEGRAM_WEBHOOK_SECRET | أمان الـ Webhook |
| MARQETA_APP_TOKEN | البطاقات الافتراضية |
| MARQETA_ADMIN_TOKEN | البطاقات الافتراضية |
| MARQETA_BASE_URL | البطاقات الافتراضية |

> ملاحظة: `LOVABLE_API_KEY` يُستخدم لفحص الصور عبر بوابة Lovable AI. عند الاستقلال الكامل، قد تحتاج استبداله بمفتاح Google AI أو OpenAI مباشر لنفس الغرض، أو تعديل وظيفة `moderate-image` لاستخدام `GOOGLE_AI_API_KEY` بدلاً منه.

