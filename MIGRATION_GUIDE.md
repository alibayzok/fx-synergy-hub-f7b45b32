# 📱 دليل ترحيل ASSASSIN FX

دليل شامل لنقل التطبيق من Lovable Cloud إلى بيئة مستقلة تماماً.

---

## 📋 جدول المحتويات

1. [المتطلبات](#-المتطلبات)
2. [تصدير الكود](#-الخطوة-1-تصدير-الكود)
3. [إنشاء مشروع Supabase](#-الخطوة-2-إنشاء-مشروع-supabase)
4. [تنفيذ Schema](#-الخطوة-3-تنفيذ-schema)
5. [تحديث الإعدادات](#-الخطوة-4-تحديث-الإعدادات)
6. [نشر Edge Functions](#-الخطوة-5-نشر-edge-functions)
7. [إعداد Firebase FCM](#-الخطوة-6-إعداد-firebase-fcm)
8. [التشغيل المحلي](#-الخطوة-7-التشغيل-المحلي)
9. [بناء APK](#-الخطوة-8-بناء-apk-للأندرويد)
10. [النشر على الويب](#-الخطوة-9-النشر-على-الويب)
11. [ترحيل البيانات](#-الخطوة-10-ترحيل-البيانات-اختياري)
12. [إعداد Google OAuth](#-الخطوة-11-إعداد-google-oauth)
13. [قائمة التحقق](#-قائمة-التحقق-النهائية)

---

## 🔧 المتطلبات

### للتطوير المحلي:
- [Node.js](https://nodejs.org/) (v18+)
- [Git](https://git-scm.com/)
- محرر أكواد (VS Code موصى به)

### لبناء تطبيق أندرويد:
- [Android Studio](https://developer.android.com/studio)
- [Java JDK 17](https://adoptium.net/)

### لحساب Supabase:
- حساب مجاني على [supabase.com](https://supabase.com)

---

## 📦 الخطوة 1: تصدير الكود

### 1.1 ربط GitHub
1. افتح المشروع في Lovable
2. اذهب إلى **Settings → GitHub**
3. اضغط **Connect to GitHub**
4. اختر حسابك وأنشئ مستودع جديد

### 1.2 استنساخ المستودع محلياً
```bash
git clone https://github.com/YOUR_USERNAME/YOUR_REPO.git
cd YOUR_REPO
```

### 1.3 تثبيت الـ Dependencies
```bash
npm install
```

---

## 🗄️ الخطوة 2: إنشاء مشروع Supabase

1. سجّل الدخول إلى [supabase.com/dashboard](https://supabase.com/dashboard)
2. اضغط **New Project**
3. اختر:
   - **اسم المشروع**: `assassin-fx` (أو أي اسم تريده)
   - **Database Password**: احفظها في مكان آمن
   - **Region**: اختر الأقرب لمستخدميك
4. انتظر حتى يكتمل الإنشاء (1-2 دقيقة)

### 2.1 نسخ بيانات الاتصال
بعد الإنشاء، اذهب إلى **Settings → API** وانسخ:
- **Project URL**: `https://xxxx.supabase.co`
- **anon public key**: المفتاح العام

---

## 🏗️ الخطوة 3: تنفيذ Schema

### 3.1 تنفيذ السكريبت
1. اذهب إلى **SQL Editor** في Supabase Dashboard
2. افتح ملف `scripts/export-schema.sql` من المشروع
3. انسخ المحتوى كاملاً
4. الصقه في SQL Editor
5. اضغط **Run**

### 3.2 التحقق من النجاح
اذهب إلى **Table Editor** وتأكد من وجود جميع الجداول (48 جدول):

**المستخدمون والأدوار:**
- `profiles`, `user_roles`, `user_blocks`, `user_privacy_settings`

**الإشارات والتحليلات:**
- `signals`, `signal_likes`, `analyses`, `analysis_likes`

**المنشورات:**
- `user_posts`, `post_likes`, `post_comments`

**المجتمع:**
- `community_rooms`, `room_members`, `room_join_requests`, `room_messages`
- `threads`, `replies`, `reply_likes`

**التعلم:**
- `learning_categories`, `learning_courses`, `learning_lessons`

**الرسائل:**
- `conversations`, `conversation_participants`, `direct_messages`

**العلاقات:**
- `follows`, `friend_requests`

**الخدمات:**
- `service_requests`, `usdt_listings`, `brokers`, `services`

**VIP والاشتراكات:**
- `vip_subscriptions`, `subscription_messages`

**البطاقات والجلسات:**
- `virtual_cards`, `live_sessions`, `live_session_messages`

**التلعيب (Gamification):**
- `user_points`, `point_transactions`, `badges`, `user_badges`
- `user_streaks`, `daily_quests`, `user_daily_progress`

**الإشعارات والدعم:**
- `user_notifications`, `admin_notifications`, `fcm_tokens`
- `support_tickets`, `support_messages`, `support_agents`

**الإعدادات:**
- `app_settings`, `flagged_content`, `articles`

---

## ⚙️ الخطوة 4: تحديث الإعدادات

### 4.1 إنشاء ملف `.env`
أنشئ ملف `.env` في جذر المشروع:

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your_anon_key_here
VITE_SUPABASE_PROJECT_ID=YOUR_PROJECT_ID
```

### 4.2 تحديث التكوين المركزي
عدّل ملف `src/config/environment.ts`:

```typescript
export const APP_URLS = {
  // غيّر هذا إلى دومينك الخاص
  production: 'https://app.yourdomain.com',
  preview: 'http://localhost:8080',
};
```

### 4.3 تحديث Capacitor Config
عدّل ملف `capacitor.config.ts`:

```typescript
const config: CapacitorConfig = {
  // غيّر هذا إلى معرّف تطبيقك
  appId: 'com.yourcompany.assassinfx',
  appName: 'ASSASSIN FX',
  webDir: 'dist',
  // احذف قسم server للإنتاج
};
```

---

## ⚡ الخطوة 5: نشر Edge Functions

المشروع يحتوي على **8 وظائف خلفية** (Edge Functions) يجب نشرها:

### 5.1 تثبيت Supabase CLI
```bash
npm install -g supabase
supabase login
```

### 5.2 ربط المشروع
```bash
supabase link --project-ref YOUR_PROJECT_ID
```

### 5.3 إعداد الأسرار (Secrets)
```bash
supabase secrets set GOOGLE_AI_API_KEY=your_google_ai_key
supabase secrets set FINNHUB_API_KEY=your_finnhub_key
supabase secrets set LOVABLE_API_KEY=your_lovable_api_key
supabase secrets set MARQETA_APP_TOKEN=your_marqeta_app_token
supabase secrets set MARQETA_ADMIN_TOKEN=your_marqeta_admin_token
supabase secrets set MARQETA_BASE_URL=your_marqeta_base_url
```

### 5.4 نشر الوظائف
```bash
supabase functions deploy chat
supabase functions deploy market-data
supabase functions deploy moderate-image
supabase functions deploy send-push-notification
supabase functions deploy fetch-news
supabase functions deploy fetch-article
supabase functions deploy fetch-calendar
supabase functions deploy marqeta-cards
```

### 5.5 وصف الوظائف
| الوظيفة | الوصف | الأسرار المطلوبة |
|---------|-------|-----------------|
| `chat` | المساعد الذكي (AI Chat) | `GOOGLE_AI_API_KEY` |
| `market-data` | بيانات الأسواق اللحظية | `FINNHUB_API_KEY` |
| `moderate-image` | فحص الصور المرفوعة | `LOVABLE_API_KEY` |
| `send-push-notification` | إرسال إشعارات FCM | `SUPABASE_SERVICE_ROLE_KEY` |
| `fetch-news` | جلب أخبار الأسواق | - |
| `fetch-article` | جلب تفاصيل المقالات | - |
| `fetch-calendar` | جلب التقويم الاقتصادي | - |
| `marqeta-cards` | إدارة البطاقات الافتراضية | `MARQETA_APP_TOKEN`, `MARQETA_ADMIN_TOKEN`, `MARQETA_BASE_URL` |

---

## 🔔 الخطوة 6: إعداد Firebase FCM

إشعارات الدفع (Push Notifications) مُعدّة بالفعل في الكود باستخدام Firebase Cloud Messaging.

### 6.1 إعداد مشروع Firebase
1. اذهب إلى [Firebase Console](https://console.firebase.google.com)
2. أنشئ مشروعاً أو استخدم مشروع `assassin-fx` الموجود
3. فعّل **Cloud Messaging**

### 6.2 تحديث الإعدادات (إذا لزم الأمر)
الإعدادات الحالية موجودة في:
- `src/lib/firebase-config.ts` - إعدادات Firebase + VAPID Key
- `public/sw.js` - Service Worker لاستقبال الإشعارات في الخلفية

### 6.3 ملاحظة
إذا كنت تستخدم مشروع Firebase مختلف، عدّل:
- `firebaseConfig` في `src/lib/firebase-config.ts`
- `firebase.initializeApp()` في `public/sw.js`
- أنشئ VAPID Key جديد من **Cloud Messaging → Web Push certificates**

---

## 🖥️ الخطوة 7: التشغيل المحلي

### 7.1 تشغيل خادم التطوير
```bash
npm run dev
```

### 7.2 فتح التطبيق
افتح المتصفح على: `http://localhost:8080`

### 7.3 اختبار التسجيل والدخول
1. أنشئ حساب جديد
2. تحقق من البريد الإلكتروني (أو فعّل auto-confirm في Supabase)
3. سجّل الدخول

---

## 📱 الخطوة 8: بناء APK للأندرويد

### 8.1 بناء ملفات الويب
```bash
npm run build
```

### 8.2 إضافة Android Platform
```bash
npx cap add android
```

### 8.3 مزامنة المشروع
```bash
npx cap sync android
```

### 8.4 فتح Android Studio
```bash
npx cap open android
```

### 8.5 بناء APK موقّع
في Android Studio:
1. **Build → Generate Signed Bundle / APK**
2. اختر **APK**
3. أنشئ Keystore جديد (احفظه في مكان آمن!)
4. اختر **release**
5. انتظر اكتمال البناء

الملف سيكون في:
```
android/app/release/app-release.apk
```

---

## 🌐 الخطوة 9: النشر على الويب

### Vercel (موصى به)
```bash
npm install -g vercel
vercel
```

### Netlify
```bash
npm install -g netlify-cli
netlify deploy --prod
```

### بعد النشر
حدّث `APP_URLS.production` في `src/config/environment.ts` بالرابط الجديد.

---

## 📊 الخطوة 10: ترحيل البيانات (اختياري)

### 10.1 تصدير البيانات من Lovable
1. اذهب إلى `/admin` في التطبيق
2. اختر تبويب **تصدير**
3. حمّل **نسخة احتياطية كاملة** (تشمل 48 جدول + هيكل + إعدادات)

### 10.2 استيراد البيانات
استخدم Supabase Dashboard:
1. **Table Editor → Import**
2. اختر ملف CSV أو أدخل البيانات يدوياً

### ⚠️ ملاحظات مهمة:
- **المستخدمون**: يجب إعادة التسجيل (كلمات المرور لا تُصدَّر)
- **الملفات**: إذا كان لديك Storage، صدّرها يدوياً
- **إعدادات التطبيق**: جدول `app_settings` يحتوي على إعدادات CMS المهمة

---

## 🔐 الخطوة 11: إعداد Google OAuth

### 11.1 إنشاء OAuth في Google Cloud
1. اذهب إلى [Google Cloud Console](https://console.cloud.google.com)
2. أنشئ مشروع جديد أو اختر مشروعاً موجوداً
3. فعّل **Google+ API**
4. اذهب إلى **APIs & Services → Credentials**
5. اضغط **Create Credentials → OAuth Client ID**
6. اختر **Web application**

### 11.2 إعداد Redirect URIs
أضف هذه الروابط في **Authorized redirect URIs**:
```
https://YOUR_PROJECT_ID.supabase.co/auth/v1/callback
```

### 11.3 إعداد Supabase
1. في Supabase Dashboard: **Authentication → Providers → Google**
2. فعّل Google Provider
3. الصق **Client ID** و **Client Secret**

### 11.4 تحديث الكود
عدّل ملف `src/lib/auth-helpers.ts`:
```typescript
const USE_LOVABLE_AUTH = false;  // غيّر من true إلى false
```

---

## ✅ قائمة التحقق النهائية

### إعداد Supabase
- [ ] إنشاء مشروع جديد
- [ ] تنفيذ `scripts/export-schema.sql` (48 جدول)
- [ ] التحقق من إنشاء جميع الجداول
- [ ] تفعيل RLS على جميع الجداول
- [ ] التحقق من حاويات التخزين الـ 7

### Edge Functions
- [ ] تثبيت Supabase CLI
- [ ] إعداد الأسرار (API Keys)
- [ ] نشر 8 وظائف: `chat`, `market-data`, `moderate-image`, `send-push-notification`, `fetch-news`, `fetch-article`, `fetch-calendar`, `marqeta-cards`
- [ ] اختبار المساعد الذكي وبيانات الأسواق

### Firebase FCM
- [ ] التحقق من إعدادات Firebase في `firebase-config.ts`
- [ ] التحقق من Service Worker في `public/sw.js`
- [ ] اختبار إشعارات الدفع

### إعداد المشروع
- [ ] استنساخ الكود من GitHub
- [ ] تثبيت الـ dependencies
- [ ] إنشاء ملف `.env`
- [ ] تحديث `environment.ts`
- [ ] تغيير `USE_LOVABLE_AUTH = false` في `auth-helpers.ts`
- [ ] اختبار التشغيل المحلي

### بناء التطبيق
- [ ] بناء ملفات الويب (`npm run build`)
- [ ] إضافة Android (`npx cap add android`)
- [ ] حذف قسم `server` من `capacitor.config.ts`
- [ ] مزامنة Capacitor (`npx cap sync`)
- [ ] بناء APK موقّع
- [ ] اختبار APK على جهاز حقيقي

### النشر
- [ ] نشر على Vercel/Netlify
- [ ] تحديث روابط التطبيق
- [ ] إعداد Google OAuth
- [ ] اختبار إعادة تعيين كلمة المرور
- [ ] اختبار التسجيل الجديد
- [ ] اختبار نظام الدعم الفني
- [ ] اختبار إعدادات CMS
- [ ] اختبار نظام التلعيب (النقاط/الشارات)
- [ ] اختبار إشعارات الدفع (FCM)

---

## 🆘 حل المشاكل الشائعة

### "Cannot connect to Supabase"
- تأكد من صحة `VITE_SUPABASE_URL`
- تأكد من صحة `VITE_SUPABASE_PUBLISHABLE_KEY`

### "RLS policy violation"
- تأكد من تنفيذ جميع سياسات RLS في Schema
- تأكد من تسجيل دخول المستخدم

### "APK لا يعمل"
- تأكد من حذف قسم `server` من `capacitor.config.ts`
- أعد بناء المشروع: `npm run build && npx cap sync`

### "Google Sign-In لا يعمل بعد الترحيل"
- تأكد من تغيير `USE_LOVABLE_AUTH = false` في `auth-helpers.ts`
- تأكد من إعداد Google OAuth في Supabase Dashboard
- تحقق من صحة Redirect URI

### "Push Notifications لا تعمل"
- تأكد من إعدادات Firebase في `firebase-config.ts`
- تأكد من تشغيل Service Worker بشكل صحيح
- تحقق من أن `send-push-notification` Edge Function منشورة

---

## 📞 الدعم

إذا واجهت مشاكل:
1. تحقق من Console في المتصفح
2. تحقق من Logs في Supabase Dashboard
3. راجع [وثائق Supabase](https://supabase.com/docs)
4. راجع [وثائق Capacitor](https://capacitorjs.com/docs)
5. راجع [وثائق Firebase](https://firebase.google.com/docs)
