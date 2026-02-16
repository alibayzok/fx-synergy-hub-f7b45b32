/**
 * FCM Manager - إدارة Firebase Cloud Messaging
 * 
 * يتعامل مع:
 * - تهيئة Firebase
 * - طلب الإذن والحصول على التوكن
 * - حفظ التوكن في قاعدة البيانات
 * - الاستماع للرسائل الواردة
 */

import { firebaseConfig, vapidKey, isFirebaseConfigured } from './firebase-config';
import { saveFcmToken, removeFcmToken } from './push-notifications';

let fcmToken: string | null = null;
let firebaseApp: any = null;
let messaging: any = null;

/**
 * تهيئة Firebase وFCM
 */
export async function initializeFCM(): Promise<string | null> {
  if (!isFirebaseConfigured()) {
    console.warn('Firebase not configured. FCM disabled.');
    return null;
  }

  try {
    // Dynamic import لتجنب تحميل Firebase إذا لم يكن مُعداً
    const { initializeApp } = await import('firebase/app');
    const { getMessaging, getToken, onMessage } = await import('firebase/messaging');

    if (!firebaseApp) {
      firebaseApp = initializeApp(firebaseConfig);
    }

    messaging = getMessaging(firebaseApp);

    // طلب إذن الإشعارات
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.warn('Notification permission denied');
      return null;
    }

    // الحصول على التوكن - استخدام SW الذي يديره VitePWA
    const swRegistration = await navigator.serviceWorker.ready;
    const token = await getToken(messaging, { vapidKey, serviceWorkerRegistration: swRegistration });
    if (token) {
      fcmToken = token;
      console.log('FCM Token obtained');
      
      // الاستماع للرسائل عندما يكون التطبيق مفتوحاً
      onMessage(messaging, (payload: any) => {
        console.log('FCM message received:', payload);
        // الإشعار يُعرض تلقائياً عبر نظام الإشعارات الداخلي
      });
    }

    return token;
  } catch (error) {
    console.error('Error initializing FCM:', error);
    return null;
  }
}

/**
 * تسجيل التوكن للمستخدم الحالي
 */
export async function registerFcmForUser(userId: string): Promise<boolean> {
  try {
    const token = await initializeFCM();
    if (!token) return false;

    return await saveFcmToken(userId, token);
  } catch (error) {
    console.error('Error registering FCM for user:', error);
    return false;
  }
}

/**
 * إلغاء تسجيل التوكن (عند تسجيل الخروج)
 */
export async function unregisterFcm(): Promise<void> {
  if (fcmToken) {
    await removeFcmToken(fcmToken);
    fcmToken = null;
  }
}

/**
 * الحصول على التوكن الحالي
 */
export function getCurrentFcmToken(): string | null {
  return fcmToken;
}
