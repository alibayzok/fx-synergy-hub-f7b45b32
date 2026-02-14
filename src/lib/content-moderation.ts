/**
 * Content Moderation Utility
 * Provides spam detection, link filtering, and content validation
 */

// URL patterns to detect
const URL_PATTERNS = [
  // Standard URLs
  /https?:\/\/[^\s<>"{}|\\^`\[\]]+/gi,
  // URLs without protocol
  /(?:www\.)[^\s<>"{}|\\^`\[\]]+/gi,
  // Common domains
  /\b[\w-]+\.(com|org|net|io|co|app|dev|me|info|biz|xyz|online|site|website|shop|store|tech|ai|cloud)\b/gi,
  // IP addresses
  /\b(?:\d{1,3}\.){3}\d{1,3}(?::\d+)?\b/g,
  // Telegram/WhatsApp links
  /(?:t\.me|telegram\.me|wa\.me|chat\.whatsapp\.com)\/[^\s]+/gi,
];

// Spam patterns
const SPAM_PATTERNS = [
  // Excessive repetition
  /(.)\1{5,}/g,
  // Money symbols repeated
  /[$€£¥₹]{2,}/g,
  // Excessive emojis (more than 10)
  /([\u{1F600}-\u{1F6FF}][\s\u{200D}]*){10,}/gu,
  // Common spam phrases (Arabic)
  /ربح مضمون|ربح سريع|اربح الآن|فرصة ذهبية|استثمر الآن|مليون دولار|أرباح خيالية|ضاعف أموالك/gi,
  // Common spam phrases (English)
  /guaranteed profit|easy money|get rich quick|make money fast|double your money|million dollars|free crypto|airdrop|giveaway/gi,
  // Referral codes patterns
  /(?:ref|referral|code|promo)[\s:=]+[A-Z0-9]{5,}/gi,
];

// Prohibited words (marketing/scam related)
const PROHIBITED_WORDS = [
  // Arabic marketing
  'سجل الآن', 'اشترك الآن', 'حصريا', 'عرض محدود', 'آخر فرصة',
  'انضم لقناتنا', 'تابعنا على', 'رابط التسجيل', 'كود الخصم',
  // English marketing
  'sign up now', 'subscribe now', 'exclusive offer', 'limited time',
  'last chance', 'join our channel', 'follow us', 'registration link',
  'discount code', 'promo code'
];

// Inappropriate/explicit content patterns
const EXPLICIT_PATTERNS = [
  // Common explicit English words/phrases
  /\b(porn|xxx|nude|nudes|naked|sex\s?chat|onlyfans|nsfw|dick\s?pic|send\s?nudes)\b/gi,
  // Arabic explicit words
  /(?:سكس|بورن|عاري|عارية|صور\s?ساخنة|فيديو\s?ساخن|نود|نيك|طيز|كس|زب)/gi,
];

export interface ModerationResult {
  isAllowed: boolean;
  reason?: 'link' | 'spam' | 'prohibited_content' | 'explicit_content' | 'too_short' | 'too_long';
  message?: string;
  detectedLinks?: string[];
  detectedSpam?: string[];
}

export interface ModerationSettings {
  allowLinks: boolean;
  allowLinksForModerators: boolean;
  spamDetection: boolean;
  minMessageLength: number;
  maxMessageLength: number;
}

// Default settings
const DEFAULT_SETTINGS: ModerationSettings = {
  allowLinks: false,
  allowLinksForModerators: true,
  spamDetection: true,
  minMessageLength: 1,
  maxMessageLength: 2000,
};

/**
 * Check if content contains URLs
 */
export function containsLinks(content: string): { hasLinks: boolean; links: string[] } {
  const links: string[] = [];
  
  for (const pattern of URL_PATTERNS) {
    const matches = content.match(pattern);
    if (matches) {
      links.push(...matches);
    }
  }
  
  // Remove duplicates
  const uniqueLinks = [...new Set(links)];
  
  return {
    hasLinks: uniqueLinks.length > 0,
    links: uniqueLinks
  };
}

/**
 * Check if content contains spam patterns
 */
export function containsSpam(content: string): { hasSpam: boolean; patterns: string[] } {
  const patterns: string[] = [];
  
  for (const pattern of SPAM_PATTERNS) {
    const matches = content.match(pattern);
    if (matches) {
      patterns.push(...matches);
    }
  }
  
  // Check for prohibited words
  const lowerContent = content.toLowerCase();
  for (const word of PROHIBITED_WORDS) {
    if (lowerContent.includes(word.toLowerCase())) {
      patterns.push(word);
    }
  }
  
  return {
    hasSpam: patterns.length > 0,
    patterns: [...new Set(patterns)]
  };
}

/**
 * Moderate content based on settings
 */
export function moderateContent(
  content: string,
  settings: Partial<ModerationSettings> = {},
  isModerator: boolean = false
): ModerationResult {
  const mergedSettings = { ...DEFAULT_SETTINGS, ...settings };
  
  // Check message length
  if (content.trim().length < mergedSettings.minMessageLength) {
    return {
      isAllowed: false,
      reason: 'too_short',
      message: 'الرسالة قصيرة جداً'
    };
  }
  
  if (content.length > mergedSettings.maxMessageLength) {
    return {
      isAllowed: false,
      reason: 'too_long',
      message: `الرسالة طويلة جداً (الحد الأقصى ${mergedSettings.maxMessageLength} حرف)`
    };
  }
  
  // Check for links (unless moderator with permission)
  if (!mergedSettings.allowLinks) {
    const shouldCheckLinks = !(isModerator && mergedSettings.allowLinksForModerators);
    
    if (shouldCheckLinks) {
      const linkCheck = containsLinks(content);
      if (linkCheck.hasLinks) {
        return {
          isAllowed: false,
          reason: 'link',
          message: 'غير مسموح بإرسال الروابط في هذه الغرفة',
          detectedLinks: linkCheck.links
        };
      }
    }
  }
  
  // Check for spam
  if (mergedSettings.spamDetection) {
    const spamCheck = containsSpam(content);
    if (spamCheck.hasSpam) {
      return {
        isAllowed: false,
        reason: 'spam',
        message: 'تم اكتشاف محتوى مخالف أو ترويجي',
        detectedSpam: spamCheck.patterns
      };
    }
  }

  // Check for explicit/inappropriate content
  for (const pattern of EXPLICIT_PATTERNS) {
    if (pattern.test(content)) {
      return {
        isAllowed: false,
        reason: 'explicit_content',
        message: 'محتوى غير لائق'
      };
    }
  }
  
  return { isAllowed: true };
}

/**
 * Sanitize content (remove dangerous patterns while keeping safe content)
 */
export function sanitizeContent(content: string): string {
  return content
    .trim()
    // Remove excessive whitespace
    .replace(/\s{3,}/g, '  ')
    // Remove zero-width characters
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    // Remove excessive line breaks
    .replace(/\n{4,}/g, '\n\n\n');
}

/**
 * Get Arabic error message for moderation result
 */
export function getModerationErrorMessage(result: ModerationResult, isArabic: boolean = true): string {
  if (result.isAllowed) return '';
  
  const messages: Record<string, { ar: string; en: string }> = {
    link: {
      ar: '🔗 غير مسموح بإرسال الروابط في هذه الغرفة',
      en: '🔗 Links are not allowed in this room'
    },
    spam: {
      ar: '⚠️ تم اكتشاف محتوى ترويجي أو مخالف',
      en: '⚠️ Promotional or prohibited content detected'
    },
    prohibited_content: {
      ar: '🚫 هذا المحتوى غير مسموح به',
      en: '🚫 This content is not allowed'
    },
    explicit_content: {
      ar: '🚫 محتوى غير لائق - هذا النوع من المحتوى محظور',
      en: '🚫 Inappropriate content - this type of content is prohibited'
    },
    too_short: {
      ar: '📝 الرسالة قصيرة جداً',
      en: '📝 Message is too short'
    },
    too_long: {
      ar: '📝 الرسالة طويلة جداً',
      en: '📝 Message is too long'
    }
  };
  
  const key = result.reason || 'prohibited_content';
  return isArabic ? messages[key]?.ar : messages[key]?.en;
}
