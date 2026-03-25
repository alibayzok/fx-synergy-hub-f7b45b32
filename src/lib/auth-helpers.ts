/**
 * ============================================================
 * مساعدات المصادقة - ASSASSIN FX
 * ============================================================
 * 
 * هذا الملف يوفر دوال مساعدة للمصادقة تعمل مع:
 * - Lovable Cloud (الوضع الحالي)
 * - Supabase العادي (بعد الترحيل)
 * 
 * عند الترحيل:
 * 1. غيّر USE_LOVABLE_AUTH إلى false
 * 2. أعد Google OAuth في Supabase Dashboard
 * 
 * ============================================================
 */

import { supabase } from '@/integrations/supabase/client';

/**
 * ⚙️ إعداد التبديل بين Lovable و Supabase
 * 
 * للترحيل: غيّر هذا إلى false
 */
const USE_LOVABLE_AUTH = false;

export type OAuthProvider = 'google' | 'apple';

interface SignInWithOAuthOptions {
  redirectTo?: string;
  extraParams?: Record<string, string>;
}

/**
 * تسجيل الدخول بـ OAuth (Google/Apple)
 * 
 * يعمل تلقائياً مع Lovable Cloud أو Supabase العادي
 */
export async function signInWithOAuth(
  provider: OAuthProvider,
  options?: SignInWithOAuthOptions
): Promise<{ error: Error | null }> {
  const redirectTo = options?.redirectTo || window.location.origin;

  if (USE_LOVABLE_AUTH) {
    // استخدام Lovable Cloud OAuth (الوضع الحالي)
    try {
      const result = await lovable.auth.signInWithOAuth(provider, {
        redirect_uri: redirectTo,
        extraParams: options?.extraParams,
      });
      
      if (result.error) {
        return { error: result.error as Error };
      }
      return { error: null };
    } catch (err) {
      return { error: err instanceof Error ? err : new Error(String(err)) };
    }
  } else {
    // استخدام Supabase OAuth العادي (بعد الترحيل)
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo,
        queryParams: options?.extraParams,
      },
    });
    return { error: error as Error | null };
  }
}

/**
 * تسجيل الدخول بـ Google
 * 
 * اختصار لـ signInWithOAuth('google', ...)
 */
export async function signInWithGoogle(
  options?: SignInWithOAuthOptions
): Promise<{ error: Error | null }> {
  return signInWithOAuth('google', options);
}

/**
 * تسجيل الدخول بـ Apple
 * 
 * اختصار لـ signInWithOAuth('apple', ...)
 */
export async function signInWithApple(
  options?: SignInWithOAuthOptions
): Promise<{ error: Error | null }> {
  return signInWithOAuth('apple', options);
}

/**
 * ============================================================
 * تعليمات الترحيل لـ Google OAuth
 * ============================================================
 * 
 * 1. أنشئ مشروع في Google Cloud Console
 * 2. فعّل Google+ API
 * 3. أنشئ OAuth 2.0 credentials
 * 4. أضف Authorized redirect URIs:
 *    - https://YOUR_PROJECT.supabase.co/auth/v1/callback
 * 5. انسخ Client ID و Client Secret
 * 6. في Supabase Dashboard:
 *    - Settings → Auth → Providers → Google
 *    - الصق Client ID و Client Secret
 * 7. غيّر USE_LOVABLE_AUTH إلى false في هذا الملف
 * 
 * ============================================================
 */
