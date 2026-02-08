
# خطة تصدير قاعدة البيانات (الهيكل + البيانات)

## نظرة عامة

سأنشئ نظام تصدير شامل يتيح للمسؤول تحميل:
1. **Schema SQL** - هيكل قاعدة البيانات الكامل
2. **البيانات JSON** - جميع البيانات من كل الجداول
3. **ملف موحد** - يحتوي على كل شيء

---

## الجداول المتوفرة للتصدير

| الجدول | الوصف |
|--------|-------|
| `profiles` | بيانات المستخدمين |
| `user_roles` | أدوار المستخدمين |
| `trades` | الصفقات |
| `threads` | المواضيع |
| `replies` | الردود |
| `reply_likes` | إعجابات الردود |
| `room_messages` | رسائل الغرف |
| `conversations` | المحادثات |
| `conversation_participants` | المشاركين |
| `direct_messages` | الرسائل المباشرة |
| `follows` | المتابعات |
| `friend_requests` | طلبات الصداقة |
| `service_requests` | طلبات الخدمات |
| `usdt_listings` | قوائم USDT |
| `admin_notifications` | إشعارات المسؤول |
| `user_notifications` | إشعارات المستخدمين |
| `user_privacy_settings` | إعدادات الخصوصية |

---

## المرحلة الأولى: إنشاء مكون التصدير

سأنشئ مكون `DatabaseExport.tsx` في مجلد `src/components/admin/` يحتوي على:

### الوظائف الرئيسية:
- **تصدير Schema SQL** - ملف SQL يحتوي على تعريف الجداول والـ Enums والـ Functions
- **تصدير البيانات JSON** - ملف JSON يحتوي على بيانات جميع الجداول
- **تصدير كامل** - ملف واحد يحتوي على الهيكل والبيانات

### واجهة المستخدم:
- أزرار لكل نوع تصدير
- شريط تقدم أثناء التحميل
- إحصائيات عن عدد السجلات في كل جدول

---

## المرحلة الثانية: دمج المكون في صفحة Admin

سأضيف تبويب جديد "التصدير" في صفحة الإدارة:

```text
┌─────────────────────────────────────────────────────────────┐
│  [نظرة عامة]  [الطلبات]  [الصفقات]  [المستخدمون]  [التصدير] │
└─────────────────────────────────────────────────────────────┘
```

---

## المرحلة الثالثة: تحديث ملفات الترجمة

سأضيف النصوص العربية والإنجليزية للميزة الجديدة

---

## الملفات التي سأنشئها/أعدلها

| الملف | العملية |
|-------|---------|
| `src/components/admin/DatabaseExport.tsx` | إنشاء جديد |
| `src/pages/AdminPage.tsx` | تعديل - إضافة تبويب التصدير |
| `src/i18n/locales/ar.json` | تعديل - إضافة الترجمة |
| `src/i18n/locales/en.json` | تعديل - إضافة الترجمة |

---

## قسم تقني

### DatabaseExport.tsx - الهيكل الرئيسي

```typescript
const TABLES = [
  'profiles', 'user_roles', 'trades', 'threads', 'replies',
  'reply_likes', 'room_messages', 'conversations', 
  'conversation_participants', 'direct_messages', 'follows',
  'friend_requests', 'service_requests', 'usdt_listings',
  'admin_notifications', 'user_notifications', 'user_privacy_settings'
];

// تصدير البيانات كـ JSON
const exportData = async () => {
  const allData = {};
  for (const table of TABLES) {
    const { data } = await supabase.from(table).select('*');
    allData[table] = data || [];
  }
  // تحميل كملف JSON
};

// تصدير الـ Schema
const exportSchema = () => {
  // إنشاء ملف SQL من ملفات migrations
  // يشمل: CREATE TABLE, Enums, Functions, RLS Policies
};
```

### Schema SQL المُصدَّر سيتضمن:

1. **Enums** - جميع أنواع البيانات المخصصة:
   - `app_role`, `asset_type`, `trade_direction`, `trade_status`, etc.

2. **Tables** - تعريفات الجداول مع الأعمدة والقيود

3. **Functions** - جميع الدوال:
   - `is_admin()`, `is_vip()`, `has_role()`, `can_access_trade()`, etc.

4. **RLS Policies** - سياسات الأمان لكل جدول

5. **Triggers** - المشغلات التلقائية

---

## صيغة ملف التصدير الكامل

```json
{
  "exportedAt": "2026-02-08T...",
  "projectName": "ASSASSIN FX",
  "schema": {
    "enums": [...],
    "tables": [...],
    "functions": [...],
    "policies": [...]
  },
  "data": {
    "profiles": [...],
    "trades": [...],
    ...
  },
  "metadata": {
    "totalRecords": 1234,
    "tablesCount": 17
  }
}
```
