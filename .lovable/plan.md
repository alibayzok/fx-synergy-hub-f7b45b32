

# ربط إعدادات CMS بجميع وظائف الذكاء الاصطناعي

## الوضع الحالي

| الوظيفة | تقرأ من CMS؟ | المزود |
|---------|-------------|--------|
| `chat` | ✅ نعم | يتبع إعدادات `ai_provider` + `custom_api_key` + `custom_endpoint` |
| `fetch-news` | ❌ لا | منطق ثابت: `GOOGLE_AI_API_KEY` → `LOVABLE_API_KEY` |
| `fetch-article` | ❌ لا | نفس المنطق الثابت |
| `fetch-calendar` | ❌ لا | نفس المنطق الثابت |
| `moderate-image` | ❌ لا | نفس المنطق الثابت |

**يعني**: لما تغيّر المزود أو مفتاح API من لوحة CMS، فقط الدردشة الذكية بتتأثر. باقي الوظائف لا تتغير.

## الحل المقترح

تحديث الوظائف الأربع لتقرأ إعدادات CMS (`ai_provider`, `custom_ai_api_key`, `custom_ai_endpoint`) من جدول `app_settings` — بنفس المنطق الموجود في `chat/index.ts`.

### المنطق الموحد لكل وظيفة:
```text
1. اقرأ ai_provider + custom_ai_api_key + custom_ai_endpoint من app_settings
2. إذا المزود = "custom" واللمفتاح موجود → استخدم الـ endpoint المخصص
3. إذا المزود = "lovable" أو لا يوجد إعداد → ابحث عن GOOGLE_AI_API_KEY أولاً ثم LOVABLE_API_KEY
```

### الملفات المتأثرة
- `supabase/functions/fetch-news/index.ts` — تعديل `getAIConfig()` لتقرأ من CMS
- `supabase/functions/fetch-article/index.ts` — نفس التعديل
- `supabase/functions/fetch-calendar/index.ts` — نفس التعديل
- `supabase/functions/moderate-image/index.ts` — نفس التعديل

### النتيجة
بعد التعديل، لما تغيّر أي إعداد AI من لوحة CMS → **كل الوظائف بتتأثر تلقائياً** — الدردشة، الأخبار، المقالات، التقويم، وفحص الصور.

