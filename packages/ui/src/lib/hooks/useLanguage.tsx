import React, { useState, ReactNode } from 'react';
import { fr } from '../../constants/fr';
import { en } from '../../constants/en';
import { LanguageContext } from '../contexts/LanguageContext';

type Language = 'fr' | 'en';

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>('fr'); // Default language

  const translations = language === 'fr' ? fr : en;

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('agenticForgeLanguage', lang);
  };

  // Load language from localStorage on initial render
  React.useEffect(() => {
    const storedLang = localStorage.getItem('agenticForgeLanguage') as Language;
    if (storedLang) {
      setLanguageState(storedLang);
    }
  }, []);

  return (
    <LanguageContext.Provider value={{ language, translations, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};