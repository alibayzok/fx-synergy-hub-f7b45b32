import { formatDistanceToNow, format as dateFnsFormat } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';

/**
 * Replaces Arabic-Indic numerals (٠-٩) with Latin numerals (0-9)
 */
export const toLatinNumerals = (str: string | number | null | undefined): string => {
  return String(str ?? '').replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)));
};

/**
 * Get the correct Arabic locale for Gregorian calendar (ar-EG instead of ar-SA which uses Hijri)
 */
export const getArabicLocale = (): string => 'ar-EG';

/**
 * Format relative time (e.g., "منذ 5 دقائق") with Latin numerals
 */
export const formatTimeAgo = (dateStr: string, language: string): string => {
  const result = formatDistanceToNow(new Date(dateStr), {
    addSuffix: true,
    locale: language === 'ar' ? ar : enUS,
  });
  return toLatinNumerals(result);
};

/**
 * Format date with a pattern (e.g., "dd MMM yyyy HH:mm") with Latin numerals
 */
export const formatDate = (dateStr: string, pattern: string, language: string): string => {
  const result = dateFnsFormat(new Date(dateStr), pattern, {
    locale: language === 'ar' ? ar : enUS,
  });
  return toLatinNumerals(result);
};

/**
 * Format date using Intl.DateTimeFormat with Gregorian calendar and Latin numerals
 */
export const formatLocalDate = (
  dateStr: string,
  language: string,
  options?: Intl.DateTimeFormatOptions
): string => {
  const locale = language === 'ar' ? 'ar-EG' : 'en-US';
  const result = new Date(dateStr).toLocaleDateString(locale, options);
  return toLatinNumerals(result);
};

/**
 * Format time using Intl.DateTimeFormat with Gregorian calendar and Latin numerals
 */
export const formatLocalTime = (
  dateStr: string,
  language: string
): string => {
  const locale = language === 'ar' ? 'ar-EG' : 'en-US';
  const result = new Date(dateStr).toLocaleTimeString(locale);
  return toLatinNumerals(result);
};
