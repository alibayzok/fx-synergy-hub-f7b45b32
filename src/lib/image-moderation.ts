/**
 * Image Moderation Utility
 * Uses NSFWJS for client-side image content moderation
 * Detects inappropriate/adult content without requiring external API keys
 */

import * as nsfwjs from 'nsfwjs';

// Model instance (lazy loaded)
let model: nsfwjs.NSFWJS | null = null;
let modelLoadingPromise: Promise<nsfwjs.NSFWJS> | null = null;

// Classification thresholds
const THRESHOLDS = {
  porn: 0.7,      // Pornographic content
  sexy: 0.85,     // Suggestive content (higher threshold to avoid false positives)
  hentai: 0.7,    // Animated adult content
};

export interface ModerationResult {
  isAllowed: boolean;
  isFlagged: boolean;
  reason?: 'porn' | 'sexy' | 'hentai' | 'error';
  confidence?: number;
  predictions?: nsfwjs.PredictionType[];
  message?: string;
}

/**
 * Load the NSFW detection model (lazy loading)
 */
async function loadModel(): Promise<nsfwjs.NSFWJS> {
  if (model) return model;
  
  if (modelLoadingPromise) {
    return modelLoadingPromise;
  }
  
  modelLoadingPromise = nsfwjs.load();
  model = await modelLoadingPromise;
  modelLoadingPromise = null;
  
  return model;
}

/**
 * Create an image element from a file or URL
 */
async function createImageElement(source: File | string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(new Error('Failed to load image'));
    
    if (source instanceof File) {
      const url = URL.createObjectURL(source);
      img.src = url;
      // Clean up object URL after image loads
      img.onload = () => {
        URL.revokeObjectURL(url);
        resolve(img);
      };
    } else {
      img.src = source;
    }
  });
}

/**
 * Check if an image contains inappropriate content
 */
export async function moderateImage(source: File | string): Promise<ModerationResult> {
  try {
    const nsfwModel = await loadModel();
    const img = await createImageElement(source);
    
    const predictions = await nsfwModel.classify(img);
    
    // Find the highest problematic prediction
    let isFlagged = false;
    let flagReason: 'porn' | 'sexy' | 'hentai' | undefined;
    let flagConfidence = 0;
    
    for (const prediction of predictions) {
      const className = prediction.className.toLowerCase() as keyof typeof THRESHOLDS;
      const threshold = THRESHOLDS[className];
      
      if (threshold && prediction.probability >= threshold) {
        if (prediction.probability > flagConfidence) {
          isFlagged = true;
          flagReason = className as 'porn' | 'sexy' | 'hentai';
          flagConfidence = prediction.probability;
        }
      }
    }
    
    if (isFlagged) {
      return {
        isAllowed: false,
        isFlagged: true,
        reason: flagReason,
        confidence: flagConfidence,
        predictions,
        message: getArabicMessage(flagReason),
      };
    }
    
    return {
      isAllowed: true,
      isFlagged: false,
      predictions,
    };
  } catch (error) {
    console.error('Image moderation error:', error);
    // On error, allow the image but flag for manual review
    return {
      isAllowed: true,
      isFlagged: true,
      reason: 'error',
      message: 'حدث خطأ في فحص الصورة - ستتم مراجعتها يدوياً',
    };
  }
}

/**
 * Check multiple images
 */
export async function moderateImages(sources: (File | string)[]): Promise<{
  allAllowed: boolean;
  results: ModerationResult[];
  flaggedCount: number;
}> {
  const results = await Promise.all(sources.map(moderateImage));
  const flaggedCount = results.filter(r => r.isFlagged).length;
  const allAllowed = results.every(r => r.isAllowed);
  
  return {
    allAllowed,
    results,
    flaggedCount,
  };
}

/**
 * Get Arabic message for the moderation reason
 */
function getArabicMessage(reason?: 'porn' | 'sexy' | 'hentai'): string {
  switch (reason) {
    case 'porn':
      return '🚫 تم اكتشاف محتوى إباحي - الصورة غير مسموح بها';
    case 'sexy':
      return '⚠️ تم اكتشاف محتوى غير لائق - الصورة غير مسموح بها';
    case 'hentai':
      return '🚫 تم اكتشاف محتوى رسوم غير لائقة - الصورة غير مسموح بها';
    default:
      return '🚫 تم اكتشاف محتوى مخالف';
  }
}

/**
 * Preload the model (call on app init for faster first scan)
 */
export async function preloadModel(): Promise<void> {
  try {
    await loadModel();
    console.log('NSFW model preloaded successfully');
  } catch (error) {
    console.error('Failed to preload NSFW model:', error);
  }
}
