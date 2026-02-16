

# خطة الاستقلال الكامل عن Lovable

## الوضع الحالي
- الويب منشور على **Vercel** (جاهز)
- الكود مصدّر على **GitHub** (جاهز)
- الـ Backend (قاعدة بيانات + تخزين + Edge Functions) لا يزال على Lovable Cloud
- دليل الترحيل (`MIGRATION_GUIDE.md`) وسكريبت التصدير (`scripts/export-schema.sql`) جاهزين بالمشروع

## المراحل المطلوبة

### المرحلة 1: إنشاء مشروع Supabase خاص
1. سجّل حساب مجاني على [supabase.com](https://supabase.com)
2. أنشئ مشروع جديد واختر Region قريب من جمهورك
3. احفظ 3 قيم مهمة: **Project URL** + **Anon Key** + **Service Role Key**

### المرحلة 2: نقل قاعدة البيانات (48 جدول + 130 سياسة أمان)
1. افتح **SQL Editor** في لوحة تحكم Supabase الجديد
2. انسخ محتوى ملف `scripts/export-schema.sql` كاملاً والصقه وشغّله
3. فعّل **Realtime** على الجداول التالية:
   - `direct_messages`, `room_messages`, `user_notifications`, `support_messages`
   - `signal_updates`, `subscription_messages`, `live_session_messages`

### المرحلة 3: إنشاء حاويات التخزين (8 حاويات)
أنشئها كـ **Public** من لوحة تحكم Supabase → Storage:
- `avatars`, `lesson-videos`, `cms-assets`, `article-images`
- `support-attachments`, `analysis-attachments`, `post-attachments`, `signal-attachments`

### المرحلة 4: نشر Edge Functions (10 وظائف)
1. ثبّت Supabase CLI: `npm install -g supabase`
2. سجّل دخول واربط المشروع:
```text
supabase login
supabase link --project-ref YOUR_PROJECT_ID
```
3. أضف الأسرار (API Keys) المطلوبة:
```text
supabase secrets set GOOGLE_AI_API_KEY=xxx
supabase secrets set FINNHUB_API_KEY=xxx
supabase secrets set TELEGRAM_BOT_TOKEN=xxx
supabase secrets set TELEGRAM_VIP_CHAT_ID=xxx
supabase secrets set TELEGRAM_PUBLIC_CHAT_ID=xxx
supabase secrets set TELEGRAM_NEWS_CHAT_ID=xxx
supabase secrets set TELEGRAM_WEBHOOK_SECRET=xxx
```
4. انشر كل الوظائف:
```text
supabase functions deploy chat
supabase functions deploy market-data
supabase functions deploy moderate-image
supabase functions deploy send-push-notification
supabase functions deploy fetch-news
supabase functions deploy fetch-article
supabase functions deploy fetch-calendar
supabase functions deploy marqeta-cards
supabase functions deploy telegram-webhook
supabase functions deploy setup-telegram-webhook
```

### المرحلة 5: تعديل الكود (4 ملفات)

**ملف `.env` (في المشروع المحلي وعلى Vercel):**
- تحديث `VITE_SUPABASE_URL` و `VITE_SUPABASE_PUBLISHABLE_KEY` و `VITE_SUPABASE_PROJECT_ID` بقيم مشروع Supabase الجديد

**ملف `src/lib/auth-helpers.ts`:**
- تغيير `USE_LOVABLE_AUTH = false` لاستخدام Google OAuth مباشرة من Supabase

**ملف `src/config/environment.ts`:**
- التأكد من أن `production` يشير إلى `https://assassinfx.vercel.app`

**ملف `capacitor.config.ts` (للـ APK):**
- حذف قسم `server` بالكامل

### المرحلة 6: إعداد Google OAuth
1. أنشئ مشروع في Google Cloud Console
2. فعّل Google+ API وأنشئ OAuth 2.0 credentials
3. أضف Redirect URI: `https://YOUR_PROJECT.supabase.co/auth/v1/callback`
4. في Supabase: Authentication → Providers → Google → الصق Client ID و Secret

### المرحلة 7: تحديث Vercel
- حدّث متغيرات البيئة (Environment Variables) في Vercel بقيم Supabase الجديد
- أعد النشر (Redeploy)

### المرحلة 8: نقل البيانات الموجودة (اختياري)
- إذا عندك بيانات مستخدمين وملفات على Lovable Cloud وبدك تنقلها، هاي خطوة إضافية بتتطلب تصدير يدوي

---

## الملخص

| العنصر | الآن (Lovable) | بعد الاستقلال |
|--------|---------------|---------------|
| الكود | GitHub | GitHub (نفسه) |
| الاستضافة | Vercel | Vercel (نفسه) |
| قاعدة البيانات | Lovable Cloud | Supabase خاص |
| التخزين (صور/فيديو) | Lovable Cloud | Supabase Storage خاص |
| Edge Functions | Lovable Cloud | Supabase خاص |
| المصادقة | Lovable OAuth | Supabase Auth مباشر |

## ملاحظة مهمة
كل التفاصيل التقنية موجودة بالتفصيل في ملف `MIGRATION_GUIDE.md` الموجود بالمشروع - هو دليلك الكامل خطوة بخطوة.

