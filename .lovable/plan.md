

## اصلاح خطأ "AbortError: signal is aborted without reason"

### المشكلة
يوجد تعارض بين Service Worker قديم (ملف `public/sw.js` الخاص بإشعارات Firebase) و Service Worker جديد ينشئه نظام PWA تلقائياً عبر Workbox. كلاهما يحاول السيطرة على التطبيق في نفس الوقت.

### الحل
دمج كود Firebase Messaging داخل Service Worker الخاص بـ PWA بدلاً من وجود ملفين منفصلين.

### خطوات التنفيذ

**1. تحويل `public/sw.js` الى ملف مساعد `public/firebase-messaging-sw.js`**
- اعادة تسمية الملف ليصبح ملف مخصص فقط لـ Firebase Messaging
- ازالة اكواد التخزين المؤقت (caching) منه لأن PWA سيتولاها

**2. تحديث اعدادات VitePWA في `vite.config.ts`**
- اضافة `importScripts` في اعدادات Workbox لاستيراد كود Firebase داخل Service Worker الموحد
- هذا يجعل ملف Service Worker واحد يدير كل شيء (PWA + الاشعارات)

**3. تحديث `src/lib/firebase-config.ts` او اي ملف يسجل Service Worker يدوياً**
- التأكد من عدم تسجيل `sw.js` يدوياً لأن VitePWA يتولى التسجيل تلقائياً

### التفاصيل التقنية

```text
قبل الاصلاح:
  sw.js (Firebase + Cache) ---- تعارض ----> PWA SW (Workbox)
                         AbortError!

بعد الاصلاح:
  PWA SW (Workbox) --importScripts--> firebase-messaging-sw.js (Firebase فقط)
                    ملف واحد موحد
```

**تغييرات الملفات:**
- `public/sw.js` → يُحذف
- `public/firebase-messaging-sw.js` → يُنشأ (كود Firebase Messaging فقط بدون caching)
- `vite.config.ts` → اضافة `importScripts: ['/firebase-messaging-sw.js']` في اعدادات Workbox
- `src/lib/firebase-config.ts` → ازالة اي تسجيل يدوي لـ `sw.js` ان وُجد
- `src/lib/fcm-manager.ts` → تحديث مرجع Service Worker

