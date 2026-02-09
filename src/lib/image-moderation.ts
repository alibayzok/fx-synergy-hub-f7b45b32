/**
 * Image Moderation Utility
 * Uses Lovable AI (Gemini) for server-side image content moderation
 * No external API keys required - uses built-in LOVABLE_API_KEY
 */

import { supabase } from '@/integrations/supabase/client';

export interface ModerationResult {
  isAllowed: boolean;
  isFlagged: boolean;
  reason?: 'porn' | 'sexy' | 'violence' | 'hate' | 'error';
  confidence?: number;
  message?: string;
}

/**
 * Convert a File to base64 string
 */
async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Remove the data URL prefix (e.g., "data:image/jpeg;base64,")
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Check if an image contains inappropriate content using Gemini AI
 */
export async function moderateImage(source: File | string): Promise<ModerationResult> {
  try {
    let requestBody: { imageBase64?: string; imageUrl?: string };

    if (source instanceof File) {
      const base64 = await fileToBase64(source);
      requestBody = { imageBase64: base64 };
    } else {
      requestBody = { imageUrl: source };
    }

    const { data, error } = await supabase.functions.invoke('moderate-image', {
      body: requestBody,
    });

    if (error) {
      console.error('Moderation function error:', error);
      // On error, allow but flag for manual review
      return {
        isAllowed: true,
        isFlagged: true,
        reason: 'error',
        message: 'حدث خطأ في فحص الصورة - ستتم مراجعتها يدوياً',
      };
    }

    return data as ModerationResult;
  } catch (error) {
    console.error('Image moderation error:', error);
    // On error, allow but flag for manual review
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
 * Get Arabic error message for moderation result
 */
export function getModerationErrorMessage(result: ModerationResult): string {
  if (result.isAllowed) return '';
  
  return result.message || 'تم اكتشاف محتوى مخالف';
}
