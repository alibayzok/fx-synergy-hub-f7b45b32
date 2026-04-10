/**
 * Capacitor OAuth Deep Link Handler
 * Safe for web — all Capacitor imports are dynamic
 */

import { supabase } from '@/integrations/supabase/client';

let authListenerInitialized = false;
let lastHandledUrl: string | null = null;

function isNative(): boolean {
  try {
    return !!(window as any)?.Capacitor?.isNativePlatform?.();
  } catch {
    return false;
  }
}

const shouldHandleAuthUrl = (url: string) => (
  url.includes('code=') ||
  url.includes('access_token') ||
  url.includes('refresh_token') ||
  url.includes('error=')
);

const getAuthParamsFromUrl = (url: string) => {
  const parsedUrl = new URL(url);
  const queryParams = new URLSearchParams(parsedUrl.search);
  const hashParams = new URLSearchParams(parsedUrl.hash.replace(/^#/, ''));
  const getParam = (key: string) => queryParams.get(key) ?? hashParams.get(key);

  return {
    code: getParam('code'),
    accessToken: getParam('access_token'),
    refreshToken: getParam('refresh_token'),
    error: getParam('error'),
    errorDescription: getParam('error_description'),
  };
};

const handleAuthCallback = async (url: string) => {
  if (!shouldHandleAuthUrl(url) || lastHandledUrl === url) return;
  lastHandledUrl = url;
  console.log('Deep link received:', url);

  try {
    try {
      const { Browser } = await import('@capacitor/browser');
      await Browser.close();
    } catch { /* ignore */ }

    const { code, accessToken, refreshToken, error, errorDescription } = getAuthParamsFromUrl(url);

    if (error) {
      console.error('OAuth callback error:', errorDescription || error);
      lastHandledUrl = null;
      return;
    }

    if (code) {
      const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
      if (exchangeError) {
        console.error('Error exchanging auth code:', exchangeError);
        lastHandledUrl = null;
      } else {
        console.log('Session exchanged successfully');
      }
      return;
    }

    if (accessToken && refreshToken) {
      const { error: sessionError } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });
      if (sessionError) {
        console.error('Error setting session:', sessionError);
        lastHandledUrl = null;
      } else {
        console.log('Session set successfully');
      }
      return;
    }

    console.error('No auth code or tokens found in deep link');
    lastHandledUrl = null;
  } catch (error) {
    console.error('Error handling auth deep link:', error);
    lastHandledUrl = null;
  }
};

export function initCapacitorAuthListener() {
  if (!isNative() || authListenerInitialized) return;
  authListenerInitialized = true;

  import('@capacitor/app').then(({ App }) => {
    App.addListener('appUrlOpen', async ({ url }) => {
      await handleAuthCallback(url);
    });

    void App.getLaunchUrl()
      .then(async (launchData) => {
        if (launchData?.url) {
          await handleAuthCallback(launchData.url);
        }
      })
      .catch((error) => {
        console.error('Error getting launch URL:', error);
      });

    console.log('Capacitor auth deep link listener initialized');
  }).catch(() => {
    console.log('Capacitor App plugin not available');
  });
}
