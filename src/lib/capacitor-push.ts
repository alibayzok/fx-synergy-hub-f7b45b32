/**
 * ============================================================
 * Capacitor Push Notifications - ASSASSIN FX
 * ============================================================
 *
 * يدير الإشعارات على تطبيق Android/iOS الأصلي
 * يستخدم @capacitor/push-notifications بدل Web Push
 *
 * ============================================================
 */

import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import { saveFcmToken, removeFcmToken } from './push-notifications';

let currentToken: string | null = null;
let initialized = false;

const REGISTRATION_TIMEOUT_MS = 15000;

async function ensurePushPermission() {
  const currentPermissions = await PushNotifications.checkPermissions();

  if (currentPermissions.receive === 'prompt') {
    return PushNotifications.requestPermissions();
  }

  return currentPermissions;
}

function waitForNativeRegistration(userId: string): Promise<string> {
  return new Promise((resolve, reject) => {
    let settled = false;
    const timeoutId = globalThis.setTimeout(() => {
      if (settled) return;
      settled = true;
      reject(new Error('Push registration timed out before receiving a token'));
    }, REGISTRATION_TIMEOUT_MS);

    const resolveOnce = (token: string) => {
      if (settled) return;
      settled = true;
      globalThis.clearTimeout(timeoutId);
      resolve(token);
    };

    const rejectOnce = (error: unknown) => {
      if (settled) return;
      settled = true;
      globalThis.clearTimeout(timeoutId);
      reject(error instanceof Error ? error : new Error(String(error)));
    };

    PushNotifications.addListener('registration', async (token) => {
      try {
        console.log('Push registration success, token:', token.value.substring(0, 20) + '...');
        currentToken = token.value;

        const saved = await saveFcmToken(userId, token.value);
        if (!saved) {
          rejectOnce(new Error('Push token received but could not be saved'));
          return;
        }

        resolveOnce(token.value);
      } catch (error) {
        rejectOnce(error);
      }
    });

    PushNotifications.addListener('registrationError', (error) => {
      console.error('Push registration error:', error);
      rejectOnce(new Error(JSON.stringify(error)));
    });

    PushNotifications.addListener('pushNotificationReceived', (notification) => {
      console.log('Push notification received:', notification);
    });

    PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
      console.log('Push notification action:', action);
      const data = action.notification.data;

      if (data?.url) {
        window.location.href = data.url;
      }
    });
  });
}

/**
 * التحقق من أن التطبيق يعمل على جهاز أصلي (Android/iOS)
 */
export function isNativePlatform(): boolean {
  return Capacitor.isNativePlatform();
}

/**
 * تهيئة الإشعارات على الجهاز الأصلي
 */
export async function initCapacitorPush(userId: string): Promise<boolean> {
  if (!isNativePlatform()) {
    console.log('Not a native platform, skipping Capacitor push setup');
    return false;
  }

  if (initialized) {
    // If already initialized but we have a token, just save it for the new user
    if (currentToken) {
      await saveFcmToken(userId, currentToken);
      return true;
    }
  }

  try {
    // طلب الإذن عند الحاجة فقط
    const permResult = await ensurePushPermission();

    if (permResult.receive !== 'granted') {
      console.warn('Push notification permission not granted:', permResult.receive);
      return false;
    }

    await PushNotifications.removeAllListeners();

    // جهّز المستمعات أولاً ثم ابدأ التسجيل حتى لا يضيع حدث registration
    const registrationPromise = waitForNativeRegistration(userId);
    await PushNotifications.register();
    await registrationPromise;

    initialized = true;
    return true;
  } catch (error) {
    console.error('Error initializing Capacitor push:', error);
    return false;
  }
}

/**
 * إلغاء التسجيل عند تسجيل الخروج
 */
export async function unregisterCapacitorPush(): Promise<void> {
  if (!isNativePlatform()) return;

  try {
    if (currentToken) {
      await removeFcmToken(currentToken);
      currentToken = null;
    }
    await PushNotifications.removeAllListeners();
    initialized = false;
  } catch (error) {
    console.error('Error unregistering Capacitor push:', error);
  }
}

/**
 * الحصول على التوكن الحالي
 */
export function getCapacitorPushToken(): string | null {
  return currentToken;
}
