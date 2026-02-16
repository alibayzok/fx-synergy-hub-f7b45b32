

# ملف مرجعي شامل لجميع أكواد Edge Functions

## الهدف
إنشاء ملف واحد `scripts/all-edge-functions-code.md` يحتوي على كود كل الـ 10 Edge Functions جاهز للنسخ واللصق في داشبورد Supabase.

## ما سيتم إنشاؤه

ملف واحد: `scripts/all-edge-functions-code.md`

### المحتوى
الملف سيحتوي على أقسام واضحة لكل function مع:
- اسم الوظيفة كعنوان
- الأسرار المطلوبة لكل وظيفة
- الكود الكامل جاهز للنسخ

### الوظائف العشرة بالترتيب:

1. **chat** - مساعد AI ذكي (يحتاج: LOVABLE_API_KEY او GOOGLE_AI_API_KEY)
2. **market-data** - بيانات السوق (يحتاج: FINNHUB_API_KEY)
3. **moderate-image** - فحص الصور (يحتاج: LOVABLE_API_KEY)
4. **send-push-notification** - إشعارات (يحتاج: FCM_SERVER_KEY)
5. **fetch-news** - جلب الأخبار (يحتاج: LOVABLE_API_KEY)
6. **fetch-article** - جلب المقالات (يحتاج: LOVABLE_API_KEY)
7. **fetch-calendar** - التقويم الاقتصادي (يحتاج: LOVABLE_API_KEY)
8. **marqeta-cards** - البطاقات الافتراضية (يحتاج: MARQETA_APP_TOKEN, MARQETA_ADMIN_TOKEN)
9. **telegram-webhook** - ويب هوك تلغرام (يحتاج: TELEGRAM_BOT_TOKEN, TELEGRAM_WEBHOOK_SECRET)
10. **setup-telegram-webhook** - إعداد ويب هوك تلغرام (يحتاج: TELEGRAM_BOT_TOKEN, TELEGRAM_WEBHOOK_SECRET)

### ملاحظة مهمة
- الأكواد ستكون نسخة طبق الأصل من الملفات الموجودة في المشروع
- كل كود داخل بلوك ```typescript جاهز للنسخ
- تذكير بإيقاف "Verify JWT" لكل function في الداشبورد

### التفاصيل التقنية
- الملف بصيغة Markdown لسهولة القراءة والنسخ
- كل قسم يبدأ بعنوان h2 (##) باسم الوظيفة
- قائمة الأسرار المطلوبة قبل كل كود
- تعليمات واضحة في البداية عن كيفية الاستخدام

