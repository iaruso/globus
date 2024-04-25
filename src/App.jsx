import './App.css';
import React, { useState } from 'react';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import Navbar from './components/Navbar';
import Globe from './components/Globe';

function App() {
  const { t } = useTranslation();
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    localStorage.setItem('theme', newTheme);
    setTheme(newTheme);
  };

  return (
    <>
      <HelmetProvider>
        <Helmet>
          <html lang={localStorage.getItem('i18nextLng').split('-')[0]} />
          <title>{t('app')}</title>
        </Helmet>
      </HelmetProvider>
      <div className="container">
        <Globe theme={theme} toggleTheme={toggleTheme} />
      </div>
      <Navbar toggleTheme={toggleTheme} theme={theme} />
    </>
  );
}

export default App;
