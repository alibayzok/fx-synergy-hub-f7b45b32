/**
 * ============================================================
 * مدير الإشعارات الصوتية - ASSASSIN FX
 * ============================================================
 */

// Cache the audio element
let notificationSound: HTMLAudioElement | null = null;

/**
 * تهيئة صوت الإشعار
 */
export function initNotificationSound(): void {
  if (typeof window === 'undefined') return;
  
  if (!notificationSound) {
    notificationSound = new Audio('/sounds/notification.mp3');
    notificationSound.volume = 0.5;
    notificationSound.preload = 'auto';
  }
}

/**
 * تشغيل صوت الإشعار
 */
export async function playNotificationSound(): Promise<void> {
  try {
    // Check if sound is enabled in settings
    const soundEnabled = localStorage.getItem('notification_sound_enabled');
    if (soundEnabled === 'false') return;

    // Initialize if not already
    initNotificationSound();

    if (notificationSound) {
      // Reset to beginning if already playing
      notificationSound.currentTime = 0;
      await notificationSound.play();
    }
  } catch (error) {
    // Ignore errors - user might not have interacted with page yet
    console.debug('Could not play notification sound:', error);
  }
}

/**
 * تفعيل/إيقاف صوت الإشعارات
 */
export function setNotificationSoundEnabled(enabled: boolean): void {
  localStorage.setItem('notification_sound_enabled', String(enabled));
}

/**
 * التحقق من حالة صوت الإشعارات
 */
export function isNotificationSoundEnabled(): boolean {
  const enabled = localStorage.getItem('notification_sound_enabled');
  return enabled !== 'false'; // Default to true
}

/**
 * تغيير مستوى الصوت (0-1)
 */
export function setNotificationVolume(volume: number): void {
  if (notificationSound) {
    notificationSound.volume = Math.max(0, Math.min(1, volume));
  }
  localStorage.setItem('notification_volume', String(volume));
}

/**
 * الحصول على مستوى الصوت
 */
export function getNotificationVolume(): number {
  const stored = localStorage.getItem('notification_volume');
  return stored ? parseFloat(stored) : 0.5;
}
