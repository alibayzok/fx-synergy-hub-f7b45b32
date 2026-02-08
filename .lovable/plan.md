

# خطة تجهيز المشروع للفصل الكامل

## الوضع الحالي

المشروع مُهيأ بشكل جيد للترحيل، لكن هناك بعض التحسينات التي ستسهل عملية الفصل لاحقاً:

| العنصر | الحالة الحالية |
|--------|---------------|
| إعدادات Supabase | تُقرأ من متغيرات البيئة ✅ |
| ملفات الـ Migrations | متوفرة (18 ملف SQL) ✅ |
| نظام تصدير البيانات | موجود في `/admin` ✅ |
| ملف Types | يُولَّد تلقائياً ✅ |
| Capacitor Config | يحتاج تعديل للإنتاج ⚠️ |
| رابط Reset Password | مرتبط بـ Lovable URL ⚠️ |
| توثيق الترحيل | غير موجود ❌ |

---

## ما سأفعله

### 1. إنشاء ملف تكوين مركزي للبيئة

سأنشئ ملف `src/config/environment.ts` يجمع كل الإعدادات المتغيرة في مكان واحد:

```text
src/config/
└── environment.ts    ← جميع الإعدادات القابلة للتغيير
```

هذا يسهل عليك تعديل جميع الروابط والإعدادات من مكان واحد عند الترحيل.

### 2. إنشاء دليل ترحيل شامل

سأنشئ ملف `MIGRATION_GUIDE.md` يحتوي على:
- خطوات الترحيل التفصيلية
- قائمة الملفات التي تحتاج تعديل
- أوامر SQL المطلوبة
- إعدادات Capacitor للإنتاج

### 3. إنشاء سكريبت تصدير موحد

سأنشئ ملف `scripts/export-schema.sql` يحتوي على:
- جميع الـ Enums
- جميع الجداول مع العلاقات
- جميع الـ Functions
- جميع سياسات RLS
- جميع الـ Triggers

---

## الملفات التي سأنشئها

| الملف | الوصف |
|-------|-------|
| `src/config/environment.ts` | تكوين مركزي للبيئة |
| `MIGRATION_GUIDE.md` | دليل الترحيل الشامل |
| `scripts/export-schema.sql` | Schema كامل جاهز للتنفيذ |

---

## الملفات التي سأعدلها

| الملف | التعديل |
|-------|---------|
| `src/hooks/useAuth.tsx` | استخدام التكوين المركزي |
| `capacitor.config.ts` | إضافة تعليقات للإنتاج |

---

## قسم تقني

### src/config/environment.ts

```typescript
// التكوين المركزي - عدّل هذه القيم عند الترحيل
export const ENV_CONFIG = {
  // روابط Supabase
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
  supabaseAnonKey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
  
  // روابط التطبيق
  appUrl: 'https://fx-synergy-hub.lovable.app',
  previewUrl: 'https://ebc9336e-82be-4f7f-b9ee-83ee20c32755.lovableproject.com',
  
  // إعدادات Capacitor
  appId: 'app.lovable.ebc9336e82be4f7fb9ee83ee20c32755',
  appName: 'ASSASSIN FX',
};
```

### MIGRATION_GUIDE.md - المحتوى الرئيسي

```markdown
# دليل ترحيل ASSASSIN FX

## الخطوة 1: تصدير الكود
1. اربط المشروع بـ GitHub من Settings → GitHub
2. استنسخ المستودع محلياً

## الخطوة 2: إنشاء مشروع Supabase جديد
1. أنشئ مشروع على supabase.com
2. انسخ Project URL و anon key

## الخطوة 3: تنفيذ Schema
نفّذ محتوى `scripts/export-schema.sql` في SQL Editor

## الخطوة 4: تحديث الإعدادات
عدّل ملف `.env` المحلي:
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your_anon_key

## الخطوة 5: بناء APK
npm install && npm run build
npx cap sync android
```

### scripts/export-schema.sql

سيحتوي على Schema كامل مستخرج من جميع ملفات الـ migrations مرتبة حسب الاعتماديات:
1. Enums أولاً
2. Tables ثانياً
3. Functions ثالثاً
4. Triggers والسياسات أخيراً

---

## النتيجة النهائية

بعد تنفيذ هذه الخطة، ستحصل على:

1. **ملف تكوين مركزي** - تعديل واحد بدلاً من البحث في عدة ملفات
2. **دليل ترحيل واضح** - خطوات مفصلة للفصل الكامل
3. **Schema SQL جاهز** - نفّذه مباشرة في Supabase الخاص بك
4. **هيكل قابل للنقل** - المشروع يعمل بشكل مستقل تماماً

