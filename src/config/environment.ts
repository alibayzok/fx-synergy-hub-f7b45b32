/**
 * ============================================================
 * التكوين المركزي للبيئة - ASSASSIN FX
 * ============================================================
 * 
 * هذا الملف يحتوي على جميع الإعدادات القابلة للتغيير في مكان واحد.
 * عند الترحيل إلى Supabase خاص بك، عدّل هذه القيم فقط.
 * 
 * ============================================================
 */

// ============================================================
// إعدادات Supabase
// ============================================================
// هذه القيم تُقرأ من متغيرات البيئة (.env)
// عند الترحيل، عدّل ملف .env الخاص بك

export const SUPABASE_CONFIG = {
  url: import.meta.env.VITE_SUPABASE_URL as string,
  anonKey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string,
  projectId: import.meta.env.VITE_SUPABASE_PROJECT_ID as string,
};

// ============================================================
// روابط التطبيق
// ============================================================
// عدّل هذه الروابط عند نشر التطبيق على دومين خاص بك

export const APP_URLS = {
  /**
   * رابط التطبيق المنشور (الإنتاج)
   * يُستخدم في: إعادة تعيين كلمة المرور، روابط البريد الإلكتروني
   * 
   * للترحيل: غيّره إلى الدومين الخاص بك
   * مثال: 'https://app.yourdomain.com'
   */
  production: 'https://fx-synergy-hub.lovable.app',
  
  /**
   * رابط المعاينة (التطوير)
   * يُستخدم في: وضع التطوير فقط
   */
  preview: 'https://ebc9336e-82be-4f7f-b9ee-83ee20c32755.lovableproject.com',
};

// ============================================================
// إعدادات Capacitor (تطبيق الموبايل)
// ============================================================
// هذه القيم تُستخدم في capacitor.config.ts

export const CAPACITOR_CONFIG = {
  /**
   * معرّف التطبيق (Bundle ID / Package Name)
   * يجب أن يكون فريداً على متجر التطبيقات
   * 
   * للترحيل: غيّره إلى معرّف خاص بك
   * مثال: 'com.yourcompany.assassinfx'
   */
  appId: 'app.lovable.ebc9336e82be4f7fb9ee83ee20c32755',
  
  /**
   * اسم التطبيق الظاهر للمستخدم
   */
  appName: 'ASSASSIN FX',
  
  /**
   * مجلد ملفات الويب المبنية
   */
  webDir: 'dist',
};

// ============================================================
// إعدادات المصادقة
// ============================================================

export const AUTH_CONFIG = {
  /**
   * رابط إعادة تعيين كلمة المرور
   * يُرسل في البريد الإلكتروني للمستخدم
   */
  resetPasswordRedirect: `${APP_URLS.production}/reset-password`,
  
  /**
   * رابط تأكيد البريد الإلكتروني بعد التسجيل
   */
  emailConfirmRedirect: APP_URLS.production,
};

// ============================================================
// التكوين الموحد (للتوافق مع الكود القديم)
// ============================================================

export const ENV_CONFIG = {
  // Supabase
  supabaseUrl: SUPABASE_CONFIG.url,
  supabaseAnonKey: SUPABASE_CONFIG.anonKey,
  supabaseProjectId: SUPABASE_CONFIG.projectId,
  
  // روابط التطبيق
  appUrl: APP_URLS.production,
  previewUrl: APP_URLS.preview,
  
  // Capacitor
  appId: CAPACITOR_CONFIG.appId,
  appName: CAPACITOR_CONFIG.appName,
  
  // Auth
  resetPasswordRedirect: AUTH_CONFIG.resetPasswordRedirect,
};

export default ENV_CONFIG;
