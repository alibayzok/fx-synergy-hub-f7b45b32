/**
 * Capacitor Push Notifications - ASSASSIN FX
 * Safe for web — all Capacitor imports are dynamic
 */

import { saveFcmToken, removeFcmToken } from './push-notifications';

let currentToken: string | null = null;
let initialized = false;

const REGISTRATION_TIMEOUT_MS = 15000;

function isNative(): boolean {
  try {
    return !!(window as any)?.Capacitor?.isNativePlatform?.();
  } catch {
    return false;
  }
}

export function isNativePlatform(): boolean {
  return isNative();
}

export async function initCapacitorPush(userId: string): Promise<boolean> {
  if (!isNative()) {
    console.log('Not a native platform, skipping Capacitor push setup');
    return false;
  }

  if (initialized && currentToken) {
    await saveFcmToken(userId, currentToken);
    return true;
  }

  try {
    const { PushNotifications } = await import('@capacitor/push-notifications');

    const currentPermissions = await PushNotifications.checkPermissions();
    let permResult = currentPermissions;
    if (currentPermissions.receive === 'prompt') {
      permResult = await PushNotifications.requestPermissions();
    }

    if (permResult.receive !== 'granted') {
      console.warn('Push notification permission not granted:', permResult.receive);
      return false;
    }

    await PushNotifications.removeAllListeners();

    const registrationPromise = new Promise<string>((resolve, reject) => {
      let settled = false;
      const timeoutId = globalThis.setTimeout(() => {
        if (settled) return;
        settled = true;
        reject(new Error('Push registration timed out'));
      }, REGISTRATION_TIMEOUT_MS);

      PushNotifications.addListener('registration', async (token) => {
        if (settled) return;
        settled = true;
        globalThis.clearTimeout(timeoutId);
        try {
          currentToken = token.value;
          const saved = await saveFcmToken(userId, token.value);
          if (!saved) reject(new Error('Could not save token'));
          else resolve(token.value);
        } catch (e) { reject(e); }
      });

      PushNotifications.addListener('registrationError', (error) => {
        if (settled) return;
        settled = true;
        globalThis.clearTimeout(timeoutId);
        reject(new Error(JSON.stringify(error)));
      });

      PushNotifications.addListener('pushNotificationReceived', (notification) => {
        console.log('Push notification received:', notification);
      });

      PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
        console.log('Push notification action:', action);
        if (action.notification.data?.url) {
          window.location.href = action.notification.data.url;
        }
      });
    });

    await PushNotifications.register();
    await registrationPromise;
    initialized = true;
    return true;
  } catch (error) {
    console.error('Error initializing Capacitor push:', error);
    return false;
  }
}

export async function unregisterCapacitorPush(): Promise<void> {
  if (!isNative()) return;
  try {
    if (currentToken) {
      await removeFcmToken(currentToken);
      currentToken = null;
    }
    const { PushNotifications } = await import('@capacitor/push-notifications');
    await PushNotifications.removeAllListeners();
    initialized = false;
  } catch (error) {
    console.error('Error unregistering Capacitor push:', error);
  }
}

export function getCapacitorPushToken(): string | null {
  return currentToken;
}
