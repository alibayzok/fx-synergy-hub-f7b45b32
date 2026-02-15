

# تفعيل إشعارات Firebase Cloud Messaging

## ملخص
تحديث إعدادات Firebase في المشروع لتفعيل الإشعارات الخارجية (Push Notifications) باستخدام بيانات مشروع Firebase الخاص بك.

## التغييرات المطلوبة

### 1. تحديث ملف إعدادات Firebase
تعبئة بيانات Firebase في ملف `src/lib/firebase-config.ts`:
- apiKey
- authDomain
- projectId
- storageBucket
- messagingSenderId
- appId
- measurementId
- VAPID Key

### 2. تحديث Service Worker
تحديث `public/sw.js` لإضافة إعدادات Firebase حتى يتمكن من استقبال الإشعارات في الخلفية.

## التفاصيل التقنية

**ملف `src/lib/firebase-config.ts`:**
- تعبئة `firebaseConfig` بالقيم المستلمة من Firebase Console
- تعبئة `vapidKey` بالمفتاح المستلم

**ملف `public/sw.js`:**
- إضافة `firebase.initializeApp()` بنفس إعدادات Firebase
- تفعيل `firebase.messaging()` لاستقبال الإشعارات في الخلفية

## النتيجة المتوقعة
بعد التحديث، سيتمكن التطبيق من:
- طلب إذن الإشعارات من المستخدم
- تسجيل توكن FCM للجهاز
- استقبال إشعارات خارجية حتى عند إغلاق التطبيق

