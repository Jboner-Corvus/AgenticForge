import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import './index.css';
import App from './App.tsx';
import { LanguageProvider } from './lib/contexts/LanguageProvider';

console.log('🚀 [MAIN] JavaScript main.tsx is loading!');
console.log('🌐 [MAIN] Current URL:', window.location.href);
console.log('⏰ [MAIN] Timestamp:', new Date().toISOString());

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LanguageProvider>
      <App />
    </LanguageProvider>
  </StrictMode>,
);
