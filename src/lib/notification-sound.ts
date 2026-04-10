/**
 * ============================================================
 * مدير الإشعارات الصوتية - ASSASSIN FX
 * نظام أصوات مميزة لكل نوع إشعار
 * ============================================================
 */

// Audio context for generating sounds
let audioContext: AudioContext | null = null;

// Sound type definitions with unique frequencies and patterns
export type NotificationSoundType = 
  | 'message'      // رسالة جديدة
  | 'comment'      // تعليق
  | 'like'         // إعجاب
  | 'trade'        // صفقة جديدة
  | 'signal'       // إشارة جديدة
  | 'friend'       // طلب صداقة
  | 'alert'        // تنبيه عام
  | 'default';     // افتراضي

interface SoundConfig {
  frequencies: number[];
  durations: number[];
  type: OscillatorType;
  gain: number;
}

// تكوين الأصوات المختلفة لكل نوع
const soundConfigs: Record<NotificationSoundType, SoundConfig> = {
  message: {
    // صوت رسالة: نغمتين صاعدتين سريعتين
    frequencies: [523, 659],
    durations: [0.1, 0.15],
    type: 'sine',
    gain: 0.3,
  },
  comment: {
    // صوت تعليق: ثلاث نغمات قصيرة
    frequencies: [440, 554, 659],
    durations: [0.08, 0.08, 0.12],
    type: 'sine',
    gain: 0.25,
  },
  like: {
    // صوت إعجاب: نغمة واحدة قصيرة وحلوة
    frequencies: [880, 1108],
    durations: [0.05, 0.1],
    type: 'sine',
    gain: 0.2,
  },
  trade: {
    // صوت صفقة: نغمة قوية ومميزة
    frequencies: [392, 523, 659, 784],
    durations: [0.1, 0.1, 0.1, 0.2],
    type: 'triangle',
    gain: 0.35,
  },
  signal: {
    // صوت إشارة: نغمة احترافية مميزة - 3 نغمات صاعدة بقوة
    frequencies: [523, 698, 880, 1047],
    durations: [0.08, 0.08, 0.08, 0.25],
    type: 'sine',
    gain: 0.4,
  },
  friend: {
    // صوت صداقة: نغمة ودية صاعدة
    frequencies: [523, 659, 784],
    durations: [0.12, 0.12, 0.18],
    type: 'sine',
    gain: 0.3,
  },
  alert: {
    // صوت تنبيه: نغمتين متعاقبتين
    frequencies: [587, 440, 587],
    durations: [0.15, 0.1, 0.15],
    type: 'square',
    gain: 0.2,
  },
  default: {
    // صوت افتراضي
    frequencies: [523, 659],
    durations: [0.12, 0.15],
    type: 'sine',
    gain: 0.25,
  },
};

// Map notification types to sound types
const notificationTypeToSound: Record<string, NotificationSoundType> = {
  // Messages
  'message': 'message',
  
  // Comments
  'trade_comment': 'comment',
  'post_comment': 'comment',
  'comment_reply': 'comment',
  'reply': 'comment',
  
  // Likes
  'post_like': 'like',
  'comment_like': 'like',
  'reply_like': 'like',
  'analysis_like': 'like',
  
  // Trades
  'trade': 'trade',
  'new_trade': 'trade',
  'trade_update': 'trade',
  
  // Signals & Analyses
  'signal': 'signal',
  'new_signal': 'signal',
  'new_analysis': 'signal',
  
  // Friends & Follows
  'friend_request': 'friend',
  'friend_accepted': 'friend',
  'new_follow': 'friend',
  
  // Articles & Channel
  'article': 'alert',
  'channel_post': 'alert',
  
  // Services
  'service_update': 'alert',
  
  // Alerts
  'alert': 'alert',
  'room_join_request': 'alert',
  'room_request_status': 'alert',
};

/**
 * تهيئة Audio Context
 */
function initAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  
  if (!audioContext) {
    try {
      audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch (error) {
      console.warn('Web Audio API not supported:', error);
      return null;
    }
  }
  
  return audioContext;
}

/**
 * تشغيل نغمة معينة
 */
async function playTone(
  ctx: AudioContext,
  frequency: number,
  duration: number,
  startTime: number,
  oscillatorType: OscillatorType,
  gainValue: number
): Promise<void> {
  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();
  
  oscillator.connect(gainNode);
  gainNode.connect(ctx.destination);
  
  oscillator.type = oscillatorType;
  oscillator.frequency.setValueAtTime(frequency, startTime);
  
  // Get volume from settings
  const volume = getNotificationVolume() * gainValue;
  
  // Fade in
  gainNode.gain.setValueAtTime(0, startTime);
  gainNode.gain.linearRampToValueAtTime(volume, startTime + 0.01);
  
  // Fade out
  gainNode.gain.linearRampToValueAtTime(0, startTime + duration);
  
  oscillator.start(startTime);
  oscillator.stop(startTime + duration);
}

/**
 * تشغيل صوت إشعار حسب النوع
 */
export async function playNotificationSound(notificationType?: string): Promise<void> {
  try {
    // Check if sound is enabled in settings
    const soundEnabled = localStorage.getItem('notification_sound_enabled');
    if (soundEnabled === 'false') return;

    const ctx = initAudioContext();
    if (!ctx) return;

    // Resume context if suspended (browser autoplay policy)
    if (ctx.state === 'suspended') {
      await ctx.resume();
    }

    // Get the sound type based on notification type
    const soundType: NotificationSoundType = notificationType 
      ? (notificationTypeToSound[notificationType] || 'default')
      : 'default';
    
    const config = soundConfigs[soundType];
    let currentTime = ctx.currentTime;

    // Play each tone in sequence
    for (let i = 0; i < config.frequencies.length; i++) {
      await playTone(
        ctx,
        config.frequencies[i],
        config.durations[i],
        currentTime,
        config.type,
        config.gain
      );
      currentTime += config.durations[i] * 0.8; // Slight overlap for smoothness
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
  localStorage.setItem('notification_volume', String(Math.max(0, Math.min(1, volume))));
}

/**
 * الحصول على مستوى الصوت
 */
export function getNotificationVolume(): number {
  const stored = localStorage.getItem('notification_volume');
  return stored ? parseFloat(stored) : 0.5;
}

/**
 * تهيئة نظام الصوت (للاستدعاء عند تفاعل المستخدم الأول)
 */
export function initNotificationSound(): void {
  initAudioContext();
}

/**
 * اختبار صوت معين
 */
export async function testNotificationSound(soundType: NotificationSoundType = 'default'): Promise<void> {
  const notificationType = Object.entries(notificationTypeToSound)
    .find(([_, type]) => type === soundType)?.[0] || '';
  await playNotificationSound(notificationType);
}
