

# سكريبت نشر شامل لجميع Edge Functions

## الهدف
انشاء ملف `scripts/deploy-all.sh` يقوم بنشر جميع الـ 10 Edge Functions وإعداد الأسرار (Secrets) المطلوبة بأمر واحد.

## ما سيتم إنشاؤه

ملف واحد: `scripts/deploy-all.sh`

### محتوى السكريبت

1. **التحقق من تثبيت Supabase CLI** - يتأكد ان الأداة موجودة قبل البدء
2. **إعداد الأسرار** - يطلب من المستخدم إدخال كل مفتاح API مطلوب ويرسلها دفعة واحدة عبر `supabase secrets set`
3. **نشر الوظائف العشرة بالترتيب:**
   - chat
   - market-data
   - moderate-image
   - send-push-notification
   - fetch-news
   - fetch-article
   - fetch-calendar
   - marqeta-cards
   - telegram-webhook
   - setup-telegram-webhook
4. **تقرير نهائي** - يعرض عدد الوظائف التي نُشرت بنجاح وأي أخطاء حصلت

### الأسرار المدعومة
- `GOOGLE_AI_API_KEY`
- `FINNHUB_API_KEY`
- `FCM_SERVER_KEY`
- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_WEBHOOK_SECRET`
- `MARQETA_APP_TOKEN`
- `MARQETA_ADMIN_ACCESS_TOKEN`
- `MARQETA_BASE_URL`

### ميزات السكريبت
- يعمل على Windows (Git Bash)، macOS، و Linux
- يتخطى الأسرار التي يتركها المستخدم فارغة
- يعرض نتيجة نجاح/فشل لكل وظيفة بألوان واضحة
- ملخص نهائي بعدد النجاحات والإخفاقات

---

## التفاصيل التقنية

- الملف سيكون bash script مع `#!/bin/bash` و `set -e` للتوقف عند الأخطاء الحرجة
- سيستخدم `command -v supabase` للتحقق من وجود CLI
- كل عملية deploy ستُلتقط نتيجتها لعرض تقرير دقيق
- السكريبت يُشغّل بالأمر: `bash scripts/deploy-all.sh`

