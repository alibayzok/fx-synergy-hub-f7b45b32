# 📱 دليل ترحيل ASSASSIN FX

دليل شامل لنقل التطبيق من Lovable Cloud إلى بيئة مستقلة تماماً.

---

## 📋 جدول المحتويات

1. [المتطلبات](#-المتطلبات)
2. [تصدير الكود](#-الخطوة-1-تصدير-الكود)
3. [إنشاء مشروع Supabase](#-الخطوة-2-إنشاء-مشروع-supabase)
4. [تنفيذ Schema](#-الخطوة-3-تنفيذ-schema)
5. [تحديث الإعدادات](#-الخطوة-4-تحديث-الإعدادات)
6. [التشغيل المحلي](#-الخطوة-5-التشغيل-المحلي)
7. [بناء APK](#-الخطوة-6-بناء-apk-للأندرويد)
8. [النشر على الويب](#-الخطوة-7-النشر-على-الويب)
9. [ترحيل البيانات](#-الخطوة-8-ترحيل-البيانات-اختياري)
10. [قائمة التحقق](#-قائمة-التحقق-النهائية)

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
اذهب إلى **Table Editor** وتأكد من وجود الجداول:
- `profiles`
- `trades`
- `user_roles`
- `conversations`
- `direct_messages`
- وباقي الجداول...

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

## 🖥️ الخطوة 5: التشغيل المحلي

### 5.1 تشغيل خادم التطوير
```bash
npm run dev
```

### 5.2 فتح التطبيق
افتح المتصفح على: `http://localhost:8080`

### 5.3 اختبار التسجيل والدخول
1. أنشئ حساب جديد
2. تحقق من البريد الإلكتروني (أو فعّل auto-confirm في Supabase)
3. سجّل الدخول

---

## 📱 الخطوة 6: بناء APK للأندرويد

### 6.1 بناء ملفات الويب
```bash
npm run build
```

### 6.2 إضافة Android Platform
```bash
npx cap add android
```

### 6.3 مزامنة المشروع
```bash
npx cap sync android
```

### 6.4 فتح Android Studio
```bash
npx cap open android
```

### 6.5 بناء APK موقّع
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

## 🌐 الخطوة 7: النشر على الويب

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

## 📊 الخطوة 8: ترحيل البيانات (اختياري)

### 8.1 تصدير البيانات من Lovable
1. اذهب إلى `/admin` في التطبيق
2. اختر تبويب **تصدير**
3. حمّل ملفات JSON للجداول المطلوبة

### 8.2 استيراد البيانات
استخدم Supabase Dashboard:
1. **Table Editor → Import**
2. اختر ملف CSV أو أدخل البيانات يدوياً

### ⚠️ ملاحظات مهمة:
- **المستخدمون**: يجب إعادة التسجيل (كلمات المرور لا تُصدَّر)
- **الملفات**: إذا كان لديك Storage، صدّرها يدوياً

---

## ✅ قائمة التحقق النهائية

### إعداد Supabase
- [ ] إنشاء مشروع جديد
- [ ] تنفيذ `scripts/export-schema.sql`
- [ ] التحقق من إنشاء الجداول
- [ ] تفعيل RLS على جميع الجداول

### إعداد المشروع
- [ ] استنساخ الكود من GitHub
- [ ] تثبيت الـ dependencies
- [ ] إنشاء ملف `.env`
- [ ] تحديث `environment.ts`
- [ ] اختبار التشغيل المحلي

### بناء التطبيق
- [ ] بناء ملفات الويب (`npm run build`)
- [ ] إضافة Android (`npx cap add android`)
- [ ] مزامنة Capacitor (`npx cap sync`)
- [ ] بناء APK موقّع
- [ ] اختبار APK على جهاز حقيقي

### النشر
- [ ] نشر على Vercel/Netlify
- [ ] تحديث روابط التطبيق
- [ ] اختبار إعادة تعيين كلمة المرور
- [ ] اختبار التسجيل الجديد

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

---

## 📞 الدعم

إذا واجهت مشاكل:
1. تحقق من Console في المتصفح
2. تحقق من Logs في Supabase Dashboard
3. راجع [وثائق Supabase](https://supabase.com/docs)
4. راجع [وثائق Capacitor](https://capacitorjs.com/docs)
