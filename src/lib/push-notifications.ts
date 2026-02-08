/**
 * ============================================================
 * Push Notifications Manager - ASSASSIN FX
 * ============================================================
 * 
 * يدعم:
 * - Web Push Notifications (Browser API)
 * - Capacitor Push Notifications (للتطبيق المحلي)
 * 
 * ============================================================
 */

export interface PushNotificationOptions {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: Record<string, unknown>;
  requireInteraction?: boolean;
}

/**
 * التحقق من دعم الإشعارات
 */
export function isPushSupported(): boolean {
  return 'Notification' in window && 'serviceWorker' in navigator;
}

/**
 * الحصول على حالة الإذن
 */
export function getNotificationPermission(): NotificationPermission | 'unsupported' {
  if (!isPushSupported()) return 'unsupported';
  return Notification.permission;
}

/**
 * طلب إذن الإشعارات
 */
export async function requestNotificationPermission(): Promise<NotificationPermission | 'unsupported'> {
  if (!isPushSupported()) {
    console.warn('Push notifications are not supported in this browser');
    return 'unsupported';
  }

  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return 'denied';
  }
}

/**
 * تسجيل Service Worker
 */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) {
    console.warn('Service Workers are not supported');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/'
    });
    console.log('Service Worker registered:', registration);
    return registration;
  } catch (error) {
    console.error('Service Worker registration failed:', error);
    return null;
  }
}

/**
 * إرسال إشعار محلي (Web Notification API)
 */
export async function showLocalNotification(options: PushNotificationOptions): Promise<Notification | null> {
  // Check if push is enabled in settings
  const pushEnabled = localStorage.getItem('push_notifications_enabled');
  if (pushEnabled === 'false') return null;

  if (!isPushSupported()) {
    console.warn('Notifications not supported');
    return null;
  }

  const permission = await requestNotificationPermission();
  if (permission !== 'granted') {
    console.warn('Notification permission not granted');
    return null;
  }

  try {
    const notification = new Notification(options.title, {
      body: options.body,
      icon: options.icon || '/favicon.ico',
      badge: options.badge || '/favicon.ico',
      tag: options.tag,
      data: options.data,
      requireInteraction: options.requireInteraction || false,
    });

    // Handle click
    notification.onclick = () => {
      window.focus();
      notification.close();
      
      // Navigate based on notification data if needed
      if (options.data?.url) {
        window.location.href = options.data.url as string;
      }
    };

    return notification;
  } catch (error) {
    console.error('Error showing notification:', error);
    return null;
  }
}

/**
 * تفعيل/إيقاف Push Notifications
 */
export function setPushNotificationsEnabled(enabled: boolean): void {
  localStorage.setItem('push_notifications_enabled', String(enabled));
}

/**
 * التحقق من حالة Push Notifications
 */
export function isPushNotificationsEnabled(): boolean {
  const enabled = localStorage.getItem('push_notifications_enabled');
  return enabled !== 'false'; // Default to true
}

/**
 * التحقق مما إذا كانت الصفحة مرئية
 */
export function isPageVisible(): boolean {
  return document.visibilityState === 'visible';
}

/**
 * إرسال إشعار خارجي فقط إذا كان التطبيق في الخلفية
 */
export async function showBackgroundNotification(options: PushNotificationOptions): Promise<Notification | null> {
  // Only show if page is hidden (app in background)
  if (isPageVisible()) {
    return null;
  }
  
  return showLocalNotification(options);
}
