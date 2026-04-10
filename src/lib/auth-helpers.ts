/**
 * مساعدات المصادقة - ASSASSIN FX
 * Safe for web — all Capacitor imports are dynamic
 */

import { supabase } from '@/integrations/supabase/client';
import { APP_URLS } from '@/config/environment';

export type OAuthProvider = 'google' | 'apple';

interface SignInWithOAuthOptions {
  redirectTo?: string;
  extraParams?: Record<string, string>;
}

const NATIVE_REDIRECT_URI = 'com.assassinfx.app://auth/callback';

function isNative(): boolean {
  try {
    return !!(window as any)?.Capacitor?.isNativePlatform?.();
  } catch {
    return false;
  }
}

export async function signInWithOAuth(
  provider: OAuthProvider,
  options?: SignInWithOAuthOptions
): Promise<{ error: Error | null }> {
  const redirectTo = isNative()
    ? NATIVE_REDIRECT_URI
    : (options?.redirectTo || window.location.origin);

  if (isNative()) {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo,
        queryParams: options?.extraParams,
        skipBrowserRedirect: true,
      },
    });

    if (error) return { error: error as Error | null };

    if (data?.url) {
      try {
        const { Browser } = await import('@capacitor/browser');
        await Browser.open({ url: data.url, windowName: '_self' });
      } catch {
        window.open(data.url, '_blank');
      }
    }
    return { error: null };
  }

  const { error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo,
      queryParams: options?.extraParams,
    },
  });
  return { error: error as Error | null };
}

export async function signInWithGoogle(options?: SignInWithOAuthOptions): Promise<{ error: Error | null }> {
  return signInWithOAuth('google', options);
}

export async function signInWithApple(options?: SignInWithOAuthOptions): Promise<{ error: Error | null }> {
  return signInWithOAuth('apple', options);
}
