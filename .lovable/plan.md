
# خطة تحويل المشروع إلى تطبيق أندرويد أصلي (APK)

## نظرة عامة

سنستخدم **Capacitor** لتحويل تطبيق ASSASSIN FX الحالي إلى تطبيق أندرويد أصلي يمكن تثبيته على الهاتف ونشره على Google Play Store.

---

## المرحلة الأولى: تثبيت Capacitor

### الحزم المطلوبة:
```text
@capacitor/core
@capacitor/cli (devDependency)
@capacitor/android
```

---

## المرحلة الثانية: إعداد ملف التكوين

سأنشئ ملف `capacitor.config.ts` بالإعدادات التالية:

| الإعداد | القيمة |
|---------|--------|
| appId | `app.lovable.ebc9336e82be4f7fb9ee83ee20c32755` |
| appName | `ASSASSIN FX` |
| webDir | `dist` |
| Server URL | للتطوير مع Hot Reload |

---

## المرحلة الثالثة: خطوات البناء على جهازك

بعد أن أجهز الملفات، ستحتاج لتنفيذ هذه الخطوات على جهازك:

### 1. تحميل المشروع
```bash
# انقل المشروع إلى GitHub عبر زر "Export to GitHub"
git clone <YOUR_REPO_URL>
cd <PROJECT_FOLDER>
```

### 2. تثبيت الحزم
```bash
npm install
```

### 3. إضافة منصة أندرويد
```bash
npx cap add android
```

### 4. بناء المشروع
```bash
npm run build
npx cap sync
```

### 5. فتح Android Studio
```bash
npx cap open android
```

### 6. بناء APK
- من Android Studio: **Build → Build Bundle(s) / APK(s) → Build APK(s)**

---

## المتطلبات على جهازك

| المتطلب | الوصف |
|---------|-------|
| Node.js | نسخة 18 أو أحدث |
| Android Studio | آخر إصدار مع Android SDK |
| Java JDK | نسخة 17 أو أحدث |

---

## الملفات التي سأنشئها

1. **capacitor.config.ts** - إعدادات Capacitor
2. تحديث **package.json** - إضافة حزم Capacitor

---

## ملاحظات مهمة

- **Hot Reload**: أثناء التطوير، سيتصل التطبيق مباشرة بسيرفر Lovable للتحديث الفوري
- **للنشر النهائي**: يجب إزالة إعداد `server.url` من `capacitor.config.ts` ليعمل التطبيق بشكل مستقل
- **التوقيع**: للنشر على Google Play، ستحتاج لتوقيع التطبيق بشهادة خاصة

---

## قسم تقني

### capacitor.config.ts
```typescript
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.ebc9336e82be4f7fb9ee83ee20c32755',
  appName: 'ASSASSIN FX',
  webDir: 'dist',
  server: {
    url: 'https://ebc9336e-82be-4f7f-b9ee-83ee20c32755.lovableproject.com?forceHideBadge=true',
    cleartext: true
  }
};

export default config;
```

### تحديثات package.json
```json
{
  "dependencies": {
    "@capacitor/core": "^7.0.0",
    "@capacitor/android": "^7.0.0"
  },
  "devDependencies": {
    "@capacitor/cli": "^7.0.0"
  }
}
```
