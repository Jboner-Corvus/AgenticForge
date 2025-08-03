import { createContext, useContext } from 'react';
import { Language, Translations } from '../types/language';

export interface LanguageContextType {
  language: Language;
  translations: Translations;
  setLanguage: (language: Language) => void;
}

export const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
