

# خطة بناء نظام ربط تلغرام بالتطبيق (Telegram Webhook)

## ملخص
بناء وظيفة سحابية (Edge Function) كاملة لاستقبال الرسائل من قنوات تلغرام وتوزيعها تلقائيا على الأقسام المناسبة في التطبيق مع الحفاظ على تنسيق النصوص والصور.

## آلية التوزيع

| قناة تلغرام | Chat ID Secret | الوجهة في التطبيق |
|---|---|---|
| القناة العامة | `TELEGRAM_PUBLIC_CHAT_ID` | جدول `signals` بصلاحية `free` |
| قناة VIP | `TELEGRAM_VIP_CHAT_ID` | جدول `signals` بصلاحية `vip` |
| قناة الأخبار | `TELEGRAM_NEWS_CHAT_ID` | جدول `articles` كمقال منشور |

## كيف يعمل النظام

1. عند النشر في قناة تلغرام، يرسل تلغرام تحديثا (channel_post) للـ webhook
2. الـ webhook يتعرف على مصدر الرسالة عبر مقارنة `chat.id` مع الـ Chat IDs المخزنة
3. بناء على المصدر، يتم إدخال البيانات في الجدول المناسب
4. اذا كانت الرسالة رد (reply) على رسالة سابقة، يتم اضافتها كـ "تحديث" في جدول `signal_updates`

## تفاصيل التنسيق

- تحويل HTML من تلغرام (bold, italic, links, code) للحفاظ على التنسيق
- تحميل الصور المرفقة من تلغرام API وتخزينها في Storage ثم ربطها بالسجل
- دعم شبكات الصور المتعددة (Media Groups)
- استخراج العنوان من السطر الاول للرسالة تلقائيا

## التفاصيل التقنية

### 1. كتابة Edge Function: `telegram-webhook/index.ts`

الوظيفة ستتضمن:

- **التحقق الأمني**: مطابقة `X-Telegram-Bot-Api-Secret-Token` مع `TELEGRAM_WEBHOOK_SECRET`
- **تحديد مصدر القناة**: مقارنة `chat.id` مع الأسرار الثلاثة
- **معالجة الصور**: تحميل الصور عبر Telegram Bot API (`getFile`) ورفعها لـ Storage bucket
- **معالجة Media Groups**: تجميع صور الألبوم الواحد وربطها برسالة واحدة عبر cache مؤقت بـ `media_group_id`
- **معالجة الردود (التحديثات)**: اذا الرسالة reply، يتم البحث عن الإشارة الأصلية عبر `telegram_message_id` وإضافة التحديث في `signal_updates`
- **تحويل التنسيق**: الحفاظ على HTML entities من تلغرام (bold, italic, links, code blocks)

### 2. اضافة عمود `telegram_message_id` لجدول `signals`

هذا العمود مطلوب لربط الردود بالإشارات الأصلية (migration جديد).

### 3. تحديث ملف التوثيق

تحديث `scripts/all-edge-functions-code.md` بالكود الجديد.

