
# اضافة بطاقة تحميل تطبيق الخدمات الرقمية في قسم الخدمات

## الهدف
اضافة بطاقة مميزة بصريا داخل تبويب "الخدمات" مخصصة لتحميل تطبيق الخدمات الرقمية المستقبلي، مع امكانية ادارة رابط التحميل من لوحة التحكم.

## الخطوات

### 1. اضافة حقول جديدة لجدول services في قاعدة البيانات
- اضافة عمود `card_type` (نوع نصي، القيمة الافتراضية 'default') للتمييز بين البطاقات العادية وبطاقة تحميل التطبيق (`app_download`)
- اضافة عمود `app_store_url` لرابط App Store (اختياري)
- اضافة عمود `play_store_url` لرابط Google Play (اختياري)
- اضافة عمود `apk_url` لرابط تحميل APK مباشر (اختياري)

### 2. اضافة خدمة "تطبيق الخدمات الرقمية" في قاعدة البيانات
- ادخال سجل جديد في جدول `services` بنوع `card_type = 'app_download'` مع اسم عربي وانجليزي ووصف ولون مميز

### 3. تصميم بطاقة تحميل التطبيق في صفحة الخدمات
- تعديل `src/pages/ServicesPage.tsx` لاضافة عرض خاص عندما يكون `card_type === 'app_download'`
- البطاقة ستتضمن:
  - ايقونة تحميل مميزة مع تدرج لوني بنفسجي/ازرق
  - شارة "جديد" او "قريبا"
  - ازرار تحميل منفصلة (Google Play / App Store / APK) حسب الروابط المتوفرة
  - اذا لم تتوفر روابط بعد، يظهر زر "قريبا" معطل مع رسالة توضيحية

### 4. تحديث لوحة تحكم الخدمات
- تعديل `src/components/admin/ServicesAndBrokersManagement.tsx` لاضافة حقول الروابط الجديدة (App Store, Play Store, APK) عند تعديل/اضافة خدمة من نوع `app_download`

---

## التفاصيل التقنية

### تغييرات قاعدة البيانات (Migration)
```sql
ALTER TABLE public.services 
  ADD COLUMN card_type text DEFAULT 'default',
  ADD COLUMN app_store_url text,
  ADD COLUMN play_store_url text,
  ADD COLUMN apk_url text;

INSERT INTO public.services (name_ar, name_en, description_ar, description_en, icon, color, is_active, sort_order, card_type, link_url, link_label_ar, link_label_en, is_external_link)
VALUES (
  'تطبيق الخدمات الرقمية',
  'Digital Services App',
  'حمّل تطبيقنا المستقل للخدمات الرقمية واستمتع بتجربة متكاملة',
  'Download our standalone digital services app for a complete experience',
  'Smartphone',
  '#8B5CF6',
  true,
  0,
  'app_download',
  '',
  'تحميل التطبيق',
  'Download App',
  true
);
```

### تصميم بطاقة التحميل
- تدرج لوني بنفسجي مع خلفية متوهجة (مشابه لبطاقة USDT لكن بلون مختلف)
- ايقونة هاتف ذكي كبيرة
- ازرار Google Play و App Store بتصميم رسمي
- حالة "قريبا" عندما لا تتوفر روابط

### الملفات المتاثرة
- `src/pages/ServicesPage.tsx` - اضافة عرض بطاقة التحميل الخاصة
- `src/components/admin/ServicesAndBrokersManagement.tsx` - اضافة حقول ادارة روابط التطبيق
- Migration SQL جديد لتحديث هيكل الجدول
