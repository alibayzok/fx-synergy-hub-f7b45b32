import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import ar from './locales/ar.json';
import en from './locales/en.json';

const savedLanguage = localStorage.getItem('app-language') || 'ar';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      ar: { translation: ar },
      en: { translation: en },
    },
    lng: savedLanguage,
    fallbackLng: 'ar',
    interpolation: {
      escapeValue: false,
    },
  });

// Update document direction when language changes
i18n.on('languageChanged', (lng) => {
  const direction = lng === 'ar' ? 'rtl' : 'ltr';
  document.documentElement.dir = direction;
  document.documentElement.lang = lng;
  localStorage.setItem('app-language', lng);
});

// Set initial direction
const initialDirection = savedLanguage === 'ar' ? 'rtl' : 'ltr';
document.documentElement.dir = initialDirection;
document.documentElement.lang = savedLanguage;

export default i18n;
