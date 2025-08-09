import { ReactNode } from 'react';
import { LanguageContext } from '../contexts/LanguageContext';
import { en } from '../../constants/en';

export const TestLanguageProvider = ({ children }: { children: ReactNode }) => {
  return (
    <LanguageContext.Provider value={{ language: 'en', translations: en, setLanguage: () => {} }}>
      {children}
    </LanguageContext.Provider>
  );
};
