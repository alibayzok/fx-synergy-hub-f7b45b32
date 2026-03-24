

# خطة تسهيل عملية النقل الكامل

## الوضع الحالي

لديك بالفعل أصول هجرة جيدة:
- `MIGRATION_GUIDE.md` — دليل شامل بـ 421 سطر
- `scripts/export-schema.sql` — سكريبت قاعدة البيانات (2025 سطر)
- `scripts/deploy-all.sh` — نشر Edge Functions + الأسرار
- `scripts/all-edge-functions-code.md` — كود الوظائف للنسخ اليدوي

## ما ينقص ويجب عمله

### 1. تحويل الـ 4 وظائف التي تعتمد على Lovable Gateway
**المشكلة**: `fetch-news`, `fetch-article`, `fetch-calendar`, `moderate-image` تستخدم `ai.gateway.lovable.dev` + `LOVABLE_API_KEY` بشكل ثابت (بدون خيار تبديل مثل `chat`).

**الحل**: تحديث كل وظيفة لتدعم نظام المزود المزدوج — تحاول `GOOGLE_AI_API_KEY` أولاً (للبيئة المستقلة) ثم `LOVABLE_API_KEY` كاحتياطي (للبيئة الحالية). نفس النمط الموجود في `chat/index.ts`.

### 2. سكريبت تنظيف الكود للإنتاج (`scripts/prepare-production.sh`)
سكريبت يعمل محلياً بعد `git clone` ويقوم تلقائياً بـ:
- حذف `lovable-tagger` من `vite.config.ts`
- حذف `src/integrations/lovable/`
- تعيين `USE_LOVABLE_AUTH = false` في `auth-helpers.ts`
- حذف قسم `server` من `capacitor.config.ts`
- طباعة تعليمات تحديث `.env`

### 3. تحديث `MIGRATION_GUIDE.md`
- إضافة قسم **Google Play + App Store** بالتفصيل
- إضافة قسم **تنظيف اعتمادات Lovable**
- إضافة قائمة التحقق النهائية (Final Checklist)
- تحديث عدد الجداول والوظائف

### 4. تحديث `scripts/all-edge-functions-code.md`
تحديث كود الوظائف الأربعة بعد تعديلها ليعكس النسخة المستقلة.

---

## التفاصيل التقنية

### تعديل Edge Functions (النمط الموحد)
كل وظيفة ستستخدم هذا المنطق:
```text
1. ابحث عن GOOGLE_AI_API_KEY
2. إذا وُجد → استخدم generativelanguage.googleapis.com مباشرة
3. إذا لم يوجد → ابحث عن LOVABLE_API_KEY → استخدم ai.gateway.lovable.dev
4. إذا لم يوجد أي منهما → أرجع خطأ واضح
```

### الملفات المتأثرة
| ملف | التغيير |
|-----|---------|
| `supabase/functions/fetch-news/index.ts` | إضافة نظام المزود المزدوج |
| `supabase/functions/fetch-article/index.ts` | إضافة نظام المزود المزدوج |
| `supabase/functions/fetch-calendar/index.ts` | إضافة نظام المزود المزدوج |
| `supabase/functions/moderate-image/index.ts` | إضافة نظام المزود المزدوج |
| `scripts/prepare-production.sh` | ملف جديد — سكريبت التنظيف |
| `MIGRATION_GUIDE.md` | تحديث شامل |
| `scripts/all-edge-functions-code.md` | تحديث الكود |

### النتيجة
بعد التنفيذ، عملية النقل تصبح:
```text
1. git clone + npm install
2. bash scripts/prepare-production.sh     ← تنظيف تلقائي
3. عدّل .env بقيم Supabase الجديد
4. نفّذ export-schema.sql في SQL Editor
5. bash scripts/deploy-all.sh             ← نشر الوظائف + الأسرار
6. npm run build → npx cap sync          ← بناء APK
```

