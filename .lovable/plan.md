

# تجربة ربط تلغرام - قناة VIP فقط

## الخطة المبسطة
سنبدأ بربط قناة VIP فقط كتجربة أولية. أي رسالة تُنشر في قناة VIP على تلغرام ستظهر تلقائياً في قسم الإشارات بالتطبيق بصلاحية `vip`.

## ما ستحتاج تجهيزه أنت (قبل البدء)

1. افتح تلغرام وابحث عن **@BotFather**
2. أرسل `/newbot` واتبع التعليمات لإنشاء بوت جديد
3. انسخ الـ **Bot Token** اللي بيعطيك إياه
4. أضف البوت كـ **مشرف (Admin)** في قناة VIP
5. للحصول على Chat ID للقناة: أرسل رسالة بالقناة ثم افتح هالرابط بالمتصفح:
   `https://api.telegram.org/bot<TOKEN>/getUpdates`
   وابحث عن `"chat":{"id":-100xxxxx}`

## ما سأنفذه أنا

### 1. إضافة الأسرار (Secrets)
- `TELEGRAM_BOT_TOKEN` - توكن البوت
- `TELEGRAM_VIP_CHAT_ID` - معرف قناة VIP
- `TELEGRAM_WEBHOOK_SECRET` - كلمة سر عشوائية للأمان

### 2. إنشاء Storage Bucket
- إنشاء `signal-attachments` لتخزين الصور المرسلة من تلغرام

### 3. إنشاء Edge Function: `telegram-webhook`
الدالة الرئيسية التي تستقبل الرسائل من تلغرام:
- تتحقق من صحة الطلب عبر Secret Token
- تقرأ الرسالة من القناة (channel_post)
- تستخرج النص (أو الـ caption إذا كانت صورة)
- إذا كانت الرسالة تحتوي صورة: تحملها من Telegram API وترفعها للتخزين
- تدرج المحتوى في جدول `signals` بصلاحية `vip`
- العنوان يكون أول سطر من الرسالة والمحتوى هو باقي النص

### 4. إنشاء Edge Function: `setup-telegram-webhook`
دالة مساعدة تُستدعى مرة واحدة لتسجيل عنوان الـ Webhook عند تلغرام.

### 5. تحديث config.toml
إضافة الدالتين الجديدتين مع `verify_jwt = false`.

---

## التفاصيل التقنية

### بنية telegram-webhook
```text
POST من Telegram --> التحقق من X-Telegram-Bot-Api-Secret-Token
  --> قراءة channel_post
  --> استخراج النص/الصور
  --> رفع الصور إلى signal-attachments bucket
  --> INSERT في signals (title, content, visibility='vip', attachments)
  --> رد 200 OK
```

### ملاحظات
- لا حاجة للهاشتاغ (#نشر) في هذه التجربة - كل رسالة بقناة VIP ستُنشر تلقائياً
- يمكن إضافة فلتر الهاشتاغ لاحقاً عند ربط قنوات إضافية
- الـ `created_by` سيكون `null` لأن الرسائل قادمة من بوت وليس من مستخدم مسجل

