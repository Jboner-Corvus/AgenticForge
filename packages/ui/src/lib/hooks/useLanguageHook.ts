import { useContext } from 'react';
import { LanguageContext } from '../contexts/LanguageContextDefinition';

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context!;
};