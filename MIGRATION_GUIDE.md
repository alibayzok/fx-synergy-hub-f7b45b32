# 📱 دليل ترحيل ASSASSIN FX - Migration Checklist

دليل شامل ومحدّث لنقل التطبيق من Lovable Cloud إلى بيئة مستقلة تماماً.

**آخر تحديث**: 2026-03-25

---

## 📋 جدول المحتويات

1. [المرحلة 1: التحضير](#-المرحلة-1-التحضير)
2. [المرحلة 2: قاعدة البيانات](#-المرحلة-2-قاعدة-البيانات-56-جدول)
3. [المرحلة 3: حاويات التخزين](#-المرحلة-3-storage-buckets-8-حاويات)
4. [المرحلة 4: Edge Functions](#-المرحلة-4-edge-functions-11-وظيفة)
5. [المرحلة 5: تعديلات الكود](#-المرحلة-5-تعديلات-الكود-4-ملفات)
6. [المرحلة 6: Google OAuth](#-المرحلة-6-google-oauth)
7. [المرحلة 7: Firebase Push Notifications](#-المرحلة-7-firebase-push-notifications)
8. [المرحلة 8: Telegram Bot](#-المرحلة-8-telegram-bot)
9. [المرحلة 9: بناء ونشر](#-المرحلة-9-بناء-ونشر)
10. [المرحلة 10: اختبار نهائي](#-المرحلة-10-اختبار-نهائي)
11. [ملخص الأسرار](#-ملخص-الأسرار-المطلوبة-15-سر)
12. [حل المشاكل](#-حل-المشاكل-الشائعة)

---

## 🔧 المرحلة 1: التحضير

### المتطلبات
- [Node.js](https://nodejs.org/) (v18+)
- [Git](https://git-scm.com/)
- [Android Studio](https://developer.android.com/studio) + Java JDK 17 (لبناء APK)
- حساب على [supabase.com](https://supabase.com)
- [Supabase CLI](https://supabase.com/docs/guides/cli)

### الخطوات
- [ ] تصدير الكود من GitHub (Settings → GitHub → Connect)
- [ ] استنساخ المستودع محلياً: `git clone ...`
- [ ] تثبيت الحزم: `npm install`
- [ ] إنشاء مشروع Supabase جديد على [supabase.com](https://supabase.com)
- [ ] نسخ **Project URL** + **Anon Key** + **Service Role Key**

---

## 🗄️ المرحلة 2: قاعدة البيانات (56 جدول)

### 2.1 تنفيذ السكريبت
1. اذهب إلى **SQL Editor** في Supabase Dashboard
2. افتح ملف `scripts/export-schema.sql` من المشروع
3. انسخ المحتوى كاملاً → الصقه → **Run**

### 2.2 التحقق اليدوي
- [ ] التأكد من جدول `signal_updates` (موجود في السكريبت)
- [ ] التأكد من جداول `referrals`, `referral_rewards`, `reward_redemptions` (موجودة في السكريبت)
- [ ] التأكد من جدول `verification_requests` و `content_views` (موجودة في السكريبت)
- [ ] التأكد من عمود `referral_code`, `is_verified`, `phone_verified`, `kyc_status` في جدول `profiles`
- [ ] تفعيل **Realtime** على الجداول المطلوبة:
  - `direct_messages`, `room_messages`, `user_notifications`, `support_messages`
  - `signal_updates`, `subscription_messages`, `live_session_messages`
- [ ] التحقق من جميع الـ **170+ RLS Policy** في **Authentication → Policies**

### 2.3 قائمة الجداول (56 جدول)

| القسم | الجداول |
|-------|---------|
| **المستخدمون** | `profiles`, `user_roles`, `user_blocks`, `user_privacy_settings` |
| **الإشارات** | `signals`, `signal_likes`, `signal_updates` |
| **التحليلات** | `analyses`, `analysis_likes` |
| **المنشورات** | `user_posts`, `post_likes`, `post_comments` |
| **المجتمع** | `community_rooms`, `room_members`, `room_join_requests`, `room_messages`, `room_message_reactions`, `room_message_views`, `threads`, `replies`, `reply_likes` |
| **التعلم** | `learning_categories`, `learning_courses`, `learning_lessons` |
| **الرسائل** | `conversations`, `conversation_participants`, `direct_messages` |
| **العلاقات** | `follows`, `friend_requests` |
| **الخدمات** | `service_requests`, `usdt_listings`, `brokers`, `services` |
| **VIP** | `vip_subscriptions`, `subscription_messages` |
| **البطاقات** | `virtual_cards` |
| **البث المباشر** | `live_sessions`, `live_session_messages` |
| **التلعيب** | `user_points`, `point_transactions`, `badges`, `user_badges`, `user_streaks`, `daily_quests`, `user_daily_progress` |
| **الإشعارات** | `user_notifications`, `admin_notifications`, `fcm_tokens` |
| **الدعم** | `support_tickets`, `support_messages`, `support_agents` |
| **الإحالات** | `referrals`, `referral_rewards`, `reward_redemptions` |
| **التوثيق** | `verification_requests` |
| **النظام** | `app_settings`, `flagged_content`, `articles`, `content_views` |

---

## 📦 المرحلة 3: Storage Buckets (9 حاويات)

أنشئ هذه الحاويات في Supabase Dashboard → Storage:

- [ ] `avatars` — صور المستخدمين (Public)
- [ ] `lesson-videos` — فيديوهات الأكاديمية (Public)
- [ ] `cms-assets` — أصول CMS (Public)
- [ ] `article-images` — صور المقالات (Public)
- [ ] `support-attachments` — مرفقات الدعم (Public)
- [ ] `analysis-attachments` — مرفقات التحليلات (Public)
- [ ] `post-attachments` — مرفقات المنشورات (Public)
- [ ] `signal-attachments` — صور شارتات الإشارات (Public)
- [ ] `kyc-documents` — وثائق التوثيق (Private)

> 💡 لا تنسَ إعداد سياسات RLS المناسبة لكل حاوية (الموجودة في `export-schema.sql`)

---

## ⚡ المرحلة 4: Edge Functions (11 وظيفة)

### 4.1 تثبيت Supabase CLI

#### Windows

**الطريقة 1: عبر npm (الأسهل)**
```bash
npm install -g supabase
```

**الطريقة 2: عبر Scoop**
```powershell
# تثبيت Scoop أولاً (إذا لم يكن مثبتاً)
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
Invoke-RestMethod -Uri https://get.scoop.sh | Invoke-Expression

# تثبيت Supabase CLI
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase
```

**الطريقة 3: عبر WinGet**
```powershell
winget install Supabase.CLI
```

#### macOS
```bash
brew install supabase/tap/supabase
```

#### Linux
```bash
brew install supabase/tap/supabase
# أو بدون Homebrew:
curl -fsSL https://raw.githubusercontent.com/supabase/cli/main/install.sh | sh
```

#### التحقق من التثبيت
```bash
supabase --version
# يجب أن يظهر رقم الإصدار مثل: 2.x.x
```

### 4.2 تسجيل الدخول وربط المشروع

```bash
# 1. تسجيل الدخول (يفتح المتصفح تلقائياً)
supabase login

# 2. ربط المشروع الجديد
#    استبدل YOUR_PROJECT_ID بالـ Reference ID من:
#    Supabase Dashboard → Settings → General → Reference ID
supabase link --project-ref YOUR_PROJECT_ID

# 3. التحقق من الربط
supabase status
```

> 💡 **أين تجد Reference ID؟**
> اذهب إلى [supabase.com/dashboard](https://supabase.com/dashboard) → اختر مشروعك → **Settings** → **General** → انسخ **Reference ID**

### 4.3 إعداد الأسرار
```bash
# المساعد الذكي
supabase secrets set GOOGLE_AI_API_KEY=your_key

# بيانات الأسواق
supabase secrets set FINNHUB_API_KEY=your_key

# فحص الصور (استبدله بـ GOOGLE_AI_API_KEY عند الاستقلال الكامل)
supabase secrets set LOVABLE_API_KEY=your_key

# تلغرام (مهم!)
supabase secrets set TELEGRAM_BOT_TOKEN=your_bot_token
supabase secrets set TELEGRAM_VIP_CHAT_ID=your_vip_chat_id
supabase secrets set TELEGRAM_PUBLIC_CHAT_ID=your_public_chat_id
supabase secrets set TELEGRAM_NEWS_CHAT_ID=your_news_chat_id
supabase secrets set TELEGRAM_WEBHOOK_SECRET=your_webhook_secret

# البطاقات الافتراضية (اختياري)
supabase secrets set MARQETA_APP_TOKEN=your_token
supabase secrets set MARQETA_ADMIN_TOKEN=your_token
supabase secrets set MARQETA_BASE_URL=your_url
```

### 4.4 نشر الوظائف
```bash
supabase functions deploy chat
supabase functions deploy market-data
supabase functions deploy moderate-image
supabase functions deploy send-push-notification
supabase functions deploy fetch-news
supabase functions deploy fetch-article
supabase functions deploy fetch-calendar
supabase functions deploy check-sla
supabase functions deploy marqeta-cards
supabase functions deploy telegram-webhook
supabase functions deploy setup-telegram-webhook
```

### 4.5 جدول الوظائف والأسرار

> 💡 جميع وظائف الذكاء الاصطناعي تدعم **نظام المزود المزدوج**: تبحث عن `GOOGLE_AI_API_KEY` أولاً (للبيئة المستقلة) ثم `LOVABLE_API_KEY` كاحتياطي.

| الوظيفة | الوصف | الأسرار المطلوبة |
|---------|-------|-----------------|
| `chat` | المساعد الذكي | `GOOGLE_AI_API_KEY` |
| `market-data` | بيانات الأسواق اللحظية | `FINNHUB_API_KEY` |
| `moderate-image` | فحص الصور المرفوعة | `GOOGLE_AI_API_KEY` |
| `send-push-notification` | إشعارات FCM | `SUPABASE_SERVICE_ROLE_KEY` (تلقائي) |
| `fetch-news` | جلب + ترجمة أخبار الأسواق | `GOOGLE_AI_API_KEY` |
| `fetch-article` | جلب + ترجمة تفاصيل المقالات | `GOOGLE_AI_API_KEY` |
| `fetch-calendar` | التقويم الاقتصادي + ترجمة | `GOOGLE_AI_API_KEY` |
| `marqeta-cards` | البطاقات الافتراضية | `MARQETA_APP_TOKEN`, `MARQETA_ADMIN_TOKEN`, `MARQETA_BASE_URL` |
| `telegram-webhook` | استقبال رسائل تلغرام | `TELEGRAM_BOT_TOKEN`, `TELEGRAM_VIP_CHAT_ID`, `TELEGRAM_PUBLIC_CHAT_ID`, `TELEGRAM_NEWS_CHAT_ID`, `TELEGRAM_WEBHOOK_SECRET` |
| `setup-telegram-webhook` | تسجيل Webhook مع تلغرام | `TELEGRAM_BOT_TOKEN`, `TELEGRAM_WEBHOOK_SECRET` |

---

## 🧹 المرحلة 5: تنظيف اعتمادات Lovable (تلقائي)

### 5.1 السكريبت التلقائي (مُستحسن)
```bash
bash scripts/prepare-production.sh
```

هذا السكريبت يقوم تلقائياً بـ:
- ✅ إزالة `lovable-tagger` من `vite.config.ts` و `package.json`
- ✅ حذف مجلد `src/integrations/lovable/`
- ✅ تعيين `USE_LOVABLE_AUTH = false` في `auth-helpers.ts`
- ✅ حذف قسم `server` من `capacitor.config.ts`

### 5.2 ملف `.env`
```env
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your_anon_key
VITE_SUPABASE_PROJECT_ID=YOUR_PROJECT_ID
```

### 5.2 ملف `src/config/environment.ts`
- [ ] تغيير `APP_URLS.production` إلى الدومين الخاص بك
- [ ] تغيير `APP_URLS.preview` إلى `http://localhost:8080`

### 5.3 ملف `src/lib/auth-helpers.ts`
```typescript
const USE_LOVABLE_AUTH = false;  // غيّر من true إلى false
```

### 5.4 ملف `capacitor.config.ts` (لبناء APK)
- [ ] تغيير `appId` إلى `com.assassinfx.app`
- [ ] **حذف قسم `server` بالكامل** (مهم جداً!)

```typescript
const config: CapacitorConfig = {
  appId: 'com.assassinfx.app',
  appName: 'ASSASSIN FX',
  webDir: 'dist',
  // لا تضع قسم server هنا!
};
```

---

## 🔐 المرحلة 6: Google OAuth

- [ ] إنشاء مشروع في [Google Cloud Console](https://console.cloud.google.com)
- [ ] تفعيل **Google+ API**
- [ ] إنشاء **OAuth 2.0 credentials** (Web Application)
- [ ] إضافة Redirect URI:
  ```
  https://YOUR_PROJECT_ID.supabase.co/auth/v1/callback
  ```
- [ ] في Supabase Dashboard: **Authentication → Providers → Google**
- [ ] لصق **Client ID** و **Client Secret**

---

## 🔔 المرحلة 7: Firebase Push Notifications

- [ ] التحقق من إعدادات `src/lib/firebase-config.ts`
- [ ] التحقق من `public/sw.js` (Service Worker)
- [ ] إذا غيّرت مشروع Firebase:
  - تحديث `firebaseConfig` في `firebase-config.ts`
  - تحديث `firebase.initializeApp()` في `public/sw.js`
  - إنشاء VAPID Key جديد من **Cloud Messaging → Web Push certificates**

---

## 🤖 المرحلة 8: Telegram Bot

> ⚠️ هذه الخطوة ضرورية إذا كنت تستخدم النشر التلقائي من تلغرام

- [ ] التأكد من أن `TELEGRAM_BOT_TOKEN` مضاف كـ Secret في Supabase الجديد
- [ ] التأكد من إضافة Chat IDs الثلاثة:
  - `TELEGRAM_VIP_CHAT_ID` — قناة VIP
  - `TELEGRAM_PUBLIC_CHAT_ID` — القناة العامة
  - `TELEGRAM_NEWS_CHAT_ID` — قناة الأخبار
- [ ] **تسجيل Webhook الجديد** (مهم جداً!):
  ```bash
  curl -X POST https://YOUR_PROJECT.supabase.co/functions/v1/setup-telegram-webhook \
    -H "Authorization: Bearer YOUR_ANON_KEY" \
    -H "Content-Type: application/json"
  ```
- [ ] اختبار النشر من تلغرام:
  - نشر إشارة مع `#نشر` في القناة العامة
  - نشر إشارة مع `#نشر` في قناة VIP
  - نشر مقال مع `#نشر` في قناة الأخبار

---

## 🚀 المرحلة 9: بناء ونشر

### الويب
```bash
npm run build
# نشر على Vercel
npx vercel --prod
# أو Netlify
npx netlify deploy --prod
```
- [ ] تحديث `APP_URLS.production` بالرابط النهائي
- [ ] تحديث Auth Redirect URLs في Supabase Dashboard

### APK (أندرويد)
```bash
npm run build
npx cap add android      # مرة واحدة فقط
npx cap sync android
npx cap open android
```
في Android Studio: **Build → Generate Signed Bundle / APK → APK → release**

الملف: `android/app/release/app-release.apk`

---

## ✅ المرحلة 10: اختبار نهائي

### المصادقة
- [ ] تسجيل حساب جديد
- [ ] تسجيل دخول بـ Google OAuth
- [ ] إعادة تعيين كلمة المرور

### الإشارات والتحليلات
- [ ] استقبال إشارة من تلغرام
- [ ] استقبال تحديث على إشارة
- [ ] نشر مقال من تلغرام
- [ ] نشر إشارة سريعة من داخل التطبيق (أدمن)
- [ ] نشر تحليل سريع من داخل التطبيق (أدمن)
- [ ] رفع صور شارتات مع الإشارات

### الميزات الأساسية
- [ ] المساعد الذكي (AI Chat)
- [ ] بيانات الأسواق
- [ ] إشعارات الدفع (Push)
- [ ] نظام التلعيب (النقاط والشارات)
- [ ] الدعم الفني
- [ ] الرسائل الخاصة
- [ ] المجتمع (الغرف، المواضيع)
- [ ] خدمة USDT
- [ ] أكاديمية التعلم

---

## 🔑 ملخص الأسرار المطلوبة (15 سر)

| السر | الاستخدام | ملاحظات |
|------|-----------|---------|
| `SUPABASE_URL` | الاتصال بقاعدة البيانات | تلقائي |
| `SUPABASE_ANON_KEY` | المفتاح العام | تلقائي |
| `SUPABASE_SERVICE_ROLE_KEY` | Push Notifications | تلقائي |
| `GOOGLE_AI_API_KEY` | المساعد الذكي | [Google AI Studio](https://aistudio.google.com) |
| `FINNHUB_API_KEY` | بيانات الأسواق | [finnhub.io](https://finnhub.io) |
| `LOVABLE_API_KEY` | فحص الصور | يمكن استبداله بـ `GOOGLE_AI_API_KEY` |
| `TELEGRAM_BOT_TOKEN` | بوت تلغرام | من [@BotFather](https://t.me/BotFather) |
| `TELEGRAM_VIP_CHAT_ID` | قناة VIP | رقم القناة |
| `TELEGRAM_PUBLIC_CHAT_ID` | القناة العامة | رقم القناة |
| `TELEGRAM_NEWS_CHAT_ID` | قناة الأخبار | رقم القناة |
| `TELEGRAM_WEBHOOK_SECRET` | أمان الـ Webhook | نص عشوائي آمن |
| `MARQETA_APP_TOKEN` | البطاقات الافتراضية | اختياري |
| `MARQETA_ADMIN_TOKEN` | البطاقات الافتراضية | اختياري |
| `MARQETA_BASE_URL` | البطاقات الافتراضية | اختياري |

> 💡 **ملاحظة**: `LOVABLE_API_KEY` يُستخدم حالياً لفحص الصور عبر بوابة Lovable AI. عند الاستقلال الكامل، عدّل وظيفة `moderate-image` لاستخدام `GOOGLE_AI_API_KEY` مباشرةً بدلاً منه.

---

## 🆘 حل المشاكل الشائعة

### "Cannot connect to Supabase"
- تأكد من صحة `VITE_SUPABASE_URL` و `VITE_SUPABASE_PUBLISHABLE_KEY` في `.env`

### "RLS policy violation"
- تأكد من تنفيذ جميع سياسات RLS في Schema
- تأكد من تسجيل دخول المستخدم

### "APK لا يعمل"
- تأكد من **حذف قسم `server`** من `capacitor.config.ts`
- أعد البناء: `npm run build && npx cap sync android`

### "Google Sign-In لا يعمل"
- تأكد من `USE_LOVABLE_AUTH = false` في `auth-helpers.ts`
- تأكد من إعداد Google OAuth في Supabase Dashboard
- تحقق من صحة Redirect URI

### "Push Notifications لا تعمل"
- تأكد من إعدادات Firebase في `firebase-config.ts`
- تأكد من نشر `send-push-notification` Edge Function
- تحقق من Service Worker

### "تلغرام لا ينشر في التطبيق"
- تأكد من تشغيل `setup-telegram-webhook` بعد النشر
- تحقق من صحة Chat IDs الثلاثة
- تأكد من استخدام `#نشر` أو `#publish` في الرسالة
- تحقق من Logs في Supabase Dashboard → Edge Functions → `telegram-webhook`

### "الصور لا تظهر"
- تأكد من إنشاء جميع حاويات التخزين الـ 8 كـ Public
- تحقق من سياسات RLS على `storage.objects`

---

---

## 📱 المرحلة 11: نشر على Google Play

### 11.1 إعداد مفتاح التوقيع
```bash
keytool -genkey -v -keystore assassinfx-release.keystore \
  -alias assassinfx -keyalg RSA -keysize 2048 -validity 10000
```
> ⚠️ **احفظ هذا الملف + كلمة المرور بأمان — إذا ضاع لن تستطيع تحديث التطبيق أبداً!**

### 11.2 بناء App Bundle
1. افتح Android Studio: `npx cap open android`
2. **Build → Generate Signed Bundle / APK**
3. اختر **Android App Bundle (.aab)**
4. اختر ملف keystore → أدخل كلمة المرور
5. اختر **release** → Finish
6. الملف: `android/app/release/app-release.aab`

### 11.3 رفع على Google Play Console
1. اذهب إلى [play.google.com/console](https://play.google.com/console) ($25 مرة واحدة)
2. **Create App** → فئة: Finance
3. أكمل **Store Listing**: أيقونة 512x512، لقطات شاشة (min 2)
4. **App Content**: سياسة الخصوصية → `/privacy-policy`
5. **Release → Production → Create Release** → ارفع `.aab`
6. **Submit** — المراجعة 1-7 أيام

---

## 🍎 المرحلة 12: نشر على App Store (iOS)

### المتطلبات
- Mac + Xcode 15+
- حساب Apple Developer ($99/سنة)

### 12.1 إضافة iOS
```bash
npx cap add ios
npx cap sync ios
npx cap open ios
```

### 12.2 إعداد Xcode
1. اختر **App target → Signing & Capabilities**
2. اختر **Team** (حساب Apple Developer)
3. **Bundle Identifier**: `com.assassinfx.app`

### 12.3 بناء ورفع
1. اختر **Any iOS Device** كهدف
2. **Product → Archive**
3. **Distribute App → App Store Connect → Upload**
4. في [appstoreconnect.apple.com](https://appstoreconnect.apple.com):
   - أنشئ تطبيق جديد
   - أضف لقطات شاشة (iPhone 6.7" + 5.5")
   - اختر Build المرفوع → **Submit for Review**
   - المراجعة 1-3 أيام

---

## ✅ قائمة التحقق النهائية (Final Checklist)

### الكود
- [ ] شغّلت `bash scripts/prepare-production.sh`
- [ ] عدّلت `.env` بقيم Supabase الجديد
- [ ] عدّلت `src/config/environment.ts` بالدومين الجديد

### قاعدة البيانات
- [ ] نفّذت `export-schema.sql` في SQL Editor
- [ ] أنشأت 9 Storage Buckets
- [ ] فعّلت Realtime على الجداول المطلوبة

### Edge Functions
- [ ] أضفت `GOOGLE_AI_API_KEY` كـ Secret
- [ ] أضفت `FINNHUB_API_KEY` كـ Secret
- [ ] شغّلت `bash scripts/deploy-all.sh`
- [ ] اختبرت كل وظيفة

### المصادقة
- [ ] أعددت Google OAuth في Supabase + Google Cloud Console
- [ ] اختبرت تسجيل الدخول بـ Google

### التطبيق
- [ ] بنيت APK/AAB بنجاح
- [ ] اختبرت APK على جهاز أندرويد حقيقي
- [ ] رفعت على Google Play Console

---

## 💰 ملخص التكاليف

| البند | التكلفة |
|-------|---------|
| حساب Google Play Developer | $25 (مرة واحدة) |
| حساب Apple Developer | $99/سنة |
| Supabase (Free Tier) | مجاناً (حتى 50,000 مستخدم) |
| Google AI API (Free Tier) | مجاناً (حتى 15 RPM) |
| Vercel (Free Tier) | مجاناً |
| Firebase (Free Tier) | مجاناً |
| دومين خاص (اختياري) | ~$10/سنة |

---

## 📞 الدعم

إذا واجهت مشاكل:
1. تحقق من Console في المتصفح
2. تحقق من Logs في Supabase Dashboard → Edge Functions
3. راجع [وثائق Supabase](https://supabase.com/docs)
4. راجع [وثائق Capacitor](https://capacitorjs.com/docs)
5. راجع [وثائق Firebase](https://firebase.google.com/docs)
