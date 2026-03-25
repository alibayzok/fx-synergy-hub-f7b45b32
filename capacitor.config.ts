import type { CapacitorConfig } from '@capacitor/cli';

/**
 * ============================================================
 * إعدادات Capacitor - ASSASSIN FX
 * ============================================================
 * 
 * للتطوير (Lovable):
 * - قسم server يربط التطبيق بخادم Lovable للتحديث اللحظي
 * 
 * للإنتاج (بناء APK مستقل):
 * 1. احذف قسم server بالكامل
 * 2. غيّر appId إلى معرّف خاص بك (مثل: com.yourcompany.assassinfx)
 * 3. نفّذ: npm run build && npx cap sync android
 * 
 * للمزيد: راجع MIGRATION_GUIDE.md
 * ============================================================
 */

const config: CapacitorConfig = {
  
  // ============================================================
  // إعدادات إضافية للإنتاج (اختياري)
  // ============================================================
  // plugins: {
  //   SplashScreen: {
  //     launchShowDuration: 2000,
  //     backgroundColor: '#000000',
  //   }
  // }
};

export default config;
